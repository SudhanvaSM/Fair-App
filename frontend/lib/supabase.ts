import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import * as aesjs from 'aes-js';
import * as crypto from 'expo-crypto';

const supabaseURL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

class LargeSecureStore {
	private async _encrypt(key: string, value: string) {
		const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));

		const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
		const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

		await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));

		return aesjs.utils.hex.fromBytes(encryptedBytes);
  	}

	private async _decrypt(key: string, value: string) {
		const encryptionKeyHex = await SecureStore.getItemAsync(key)
		if (!encryptionKeyHex) {
			return null
		}

		// Must be exactly 32 bytes of hex (64 chars) and the ciphertext must be hex too
		const isHex = (s: string) => /^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0
		if (encryptionKeyHex.length !== 64 || !isHex(encryptionKeyHex) || !isHex(value)) {
			await this.removeItem(key) // corrupt/legacy data: drop it, user will just sign in again
			return null
		}

		try {
			const cipher = new aesjs.ModeOfOperation.ctr(
				aesjs.utils.hex.toBytes(encryptionKeyHex),
				new aesjs.Counter(1)
			)
			return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)))
		} catch {
			await this.removeItem(key)
			return null
		}
	}

	async getItem(key: string) {
		const encrypted = await AsyncStorage.getItem(key)
		if (!encrypted) {
			return encrypted
		}

		return await this._decrypt(key, encrypted)
	}

	async removeItem(key: string) {
		await AsyncStorage.removeItem(key)
		await SecureStore.deleteItemAsync(key)
	}

	async setItem(key: string, value: string) {
		const encrypted = await this._encrypt(key, value)

		await AsyncStorage.setItem(key, encrypted)
	}
}

export const supabase = createClient(
	supabaseURL, 
	supabasePublishableKey,
	{
		auth: {
			storage: new LargeSecureStore(),
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: false,
			flowType: 'pkce',
		},
	}
);

