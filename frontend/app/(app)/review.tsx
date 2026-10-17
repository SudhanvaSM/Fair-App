import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { randomUUID } from "expo-crypto";
import { MaterialIcons } from "@expo/vector-icons";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from "react-native";

import { Item } from "@/types/item";

import Edit from "@/components/Edit";
import AddBlock from "@/components/AddBlock";

export default function Review() {
	const { items, groupId } = useLocalSearchParams();
	const parsedParam = Array.isArray(items) ? items[0] : items;
	const data = parsedParam ? JSON.parse(parsedParam) : null;

	const raw = data?.raw ?? { items: [], subtotal: 0, tax: 0 };

	const isEdit = data.mode === "edit";
	const editMetadata = isEdit ? {
		mode: "edit",
		originalReceiptId: data.originalReceiptId,
		createdAt: data.createdAt,
		title: data.title,
		payerMemberId: data.payerMemberId,
		groupId: data.groupId ?? groupId,
	} : {};
	const [itemsState, setItemsState] = useState(() => {
		const used = new Set<string>();
		return raw.items.map((item: Item) => {
			const itemId = item.itemId && !used.has(item.itemId) ? item.itemId : randomUUID();
			used.add(itemId);
			return { ...item, itemId };
		});
	});
	const [editingId, setEditingId] = useState<string | null>(null);

	const removeItem = (id: string) => {
		setItemsState((prev: Item[]) =>
			prev.filter(item => item.itemId !== id)
		);
	};

	const [showInput, setShowInput] = useState(false);
	const [newItemName, setNewItemName] = useState("");
	const addItem = (name: string) => {
		const newItem: Item = {
			itemId: randomUUID(),
			name: name,
			qty: 1,
			unitPrice: 0,
			totalPrice: 0,
		};
		setItemsState((prev: Item[]) => [...prev, newItem]);
		setShowInput(false);
	};
	
	const [includeServiceCharge, setIncludeServiceCharge] = useState<boolean>(raw.includeServiceCharge ?? (raw.service_charge ?? raw.serviceCharge ?? 0) > 0);

	const computedSubtotal = itemsState.reduce(
  		(sum: number, item: Item) => sum + item.totalPrice, 0
	);

	const subtotalDiff = Math.abs((raw.subtotal ?? 0) - computedSubtotal);

	const [taxInput, setTaxInput] = useState(isEdit ? String(raw.tax ?? 0) : "");
	const [tempTaxInput, setTempTaxInput] = useState("");
	const [isEditingTax, setIsEditingTax] = useState(false);

	const [tipInput, setTipInput] = useState(isEdit ? String(raw.finalTip ?? 0) : "");
	const [tempTipInput, setTempTipInput] = useState("");
	const [isEditingTip, setIsEditingTip] = useState(false);

	let tax = 0;
	let taxRate = 0;

	if (subtotalDiff > 5) {
		taxRate = 0.05
		tax = computedSubtotal * taxRate;
	} 
	else {
		if (raw.subtotal > 0)
			taxRate = raw.tax / raw.subtotal;
		else taxRate = 0.05;
		if (taxRate < 0.04 || taxRate > 0.06) {
			taxRate = 0.05;
		}
		tax = computedSubtotal * taxRate;
	}

	const parsedTax = parseFloat(taxInput)
	const finalTax = !isNaN(parsedTax) ? parsedTax : tax;

	const parsedTip = parseFloat(tipInput)
	const finalTip = !isNaN(parsedTip) ? parsedTip : 0;

	const serviceCharge = includeServiceCharge ? (raw.service_charge ?? raw.serviceCharge ?? 0) : 0;

	const total = computedSubtotal + finalTax + finalTip + serviceCharge;
	
	const updatedData = {
		...data,
		...editMetadata,
		raw: {
			...raw,
			items: itemsState,
			subtotal: computedSubtotal,
			tax: finalTax,
			total: total,
			serviceCharge: serviceCharge,
			service_charge: serviceCharge,
			includeServiceCharge: includeServiceCharge,
			finalTip: finalTip,
		},
	};
	if (!data || !data.raw || !data.raw.items) {
		console.log("BROKEN DATA:", data);
		return <Text style={{ color: "white" }}>No Data</Text>;
	}

  return (
	<>
		<Stack.Screen
        options={{
          headerStyle: { backgroundColor: "#1E293B" },
          headerTitle: "Review Receipt",
          headerTitleAlign: "left",
          headerShadowVisible: false,
          headerTintColor: "#ffffff",
		  animation: "slide_from_right",
        }}
      />
	  <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
		keyboardShouldPersistTaps="handled"
      >
		{itemsState.length === 0 ? (
			<View style={{ alignItems: "center", marginTop: 40 }}>
				<Text style={{ color: "#fff", fontSize: 16 }}>
				No items found
				</Text>
				<AddBlock
					showInput={showInput}
					setShowInput={setShowInput}
					newName={newItemName}
      				setNewName={setNewItemName}
      				onAdd={addItem}
				/>
			</View>
		)
		:
		(
			<View style={{alignItems: "center"}}>
				<View style={styles.card}>
					{itemsState.map((item: Item) =>
						editingId === item.itemId ? (
							<Edit
							key={item.itemId}
							item={item}
							onCancel={() => setEditingId(null)}
							onSave={(updatedItem: Item) => {
								setItemsState((prev: Item[]) =>
								prev.map(i =>
									i.itemId === updatedItem.itemId ? updatedItem : i
								)
								);
								setEditingId(null);
							}}
							/>
						) : (
							<Pressable
							key={item.itemId}
							style={styles.row}
							onPress={() => setEditingId(item.itemId)}
							>
								{typeof item.confidence === "number" && 
								item.confidence <= 80 && (
									<MaterialIcons
									name={"warning"} 
									size={18} 
									color={"orange"}
									style={{ justifyContent: "center" }}
								/>
								)}
							<Text style={styles.itemName}>
								{item.qty} x {item.name}
							</Text>
							<Text style={styles.price}>₹{item.totalPrice.toFixed(2)}</Text>
							<Pressable 
							onPress={(e) => {
								e.stopPropagation();
								removeItem(item.itemId)}}
							style={{ justifyContent: "center" }}
							>
								<MaterialIcons 
								name={"highlight-remove"} 
								size={20} 
								color={"red"}
								/>
							</Pressable>
							</Pressable>
						)
						)}

						<AddBlock
							showInput={showInput}
							setShowInput={setShowInput}
							newName={newItemName}
							setNewName={setNewItemName}
							onAdd={addItem}
						/>

					{/* Divider */}
					<View style={styles.divider} />

					{/* SUMMARY */}
					<View style={styles.row}>
						<Text style={styles.label}>Subtotal</Text>
						<Text style={styles.price}>₹{computedSubtotal.toFixed(2)}</Text>
					</View>

					<View style={styles.row}>
						<Text style={styles.label}>Estimated Tax @ {Math.round(taxRate * 100)}%</Text>
						{isEditingTax ? (
							<View style={[styles.input, { gap: 8, paddingVertical: 8}]}>
								<TextInput 
									style={[{ color: "#fff", borderBottomWidth: 1, borderColor: "#888" }]}
									onChangeText={setTempTaxInput}
									value={tempTaxInput}
									placeholder="Enter tax value"
									placeholderTextColor="#888"
									keyboardType="numeric"
									autoFocus
								/>
								<View style={{ flexDirection: "row", justifyContent: "space-between", gap: 20 }}>
									<Pressable
										hitSlop={10}
										onPress={() => {
											setIsEditingTax(false);
											setTempTaxInput("");
										}}
									>
										<Text style={{ color: "red" }}>Cancel</Text>
									</Pressable>

									<Pressable
										hitSlop={10}
										onPress={() => {
											const parsedTax = parseFloat(tempTaxInput);
											if (isNaN(parsedTax) || parsedTax < 0 || parsedTax > 9999) {
												Alert.alert("Invalid input", "Enter a valid number.",
													[{ text: "OK" }],
													{cancelable: true,});
												return;
											}
											setIsEditingTax(false);
											setTaxInput(parsedTax.toFixed(2));
										}}
									>
										<Text style={{ color: "#10B981" }}>Save</Text>
									</Pressable>
								</View>
							</View>
						) : (
							<Pressable 
								onPress={() => {
									setTempTaxInput(taxInput || finalTax.toFixed(2));
									setIsEditingTax(true)
								}}
							>
								<Text style={styles.price}>
									₹{finalTax.toFixed(2)}
								</Text>
							</Pressable>
						)}
					</View>

					{includeServiceCharge && (raw.service_charge ?? raw.serviceCharge ?? 0) !== 0 && (
						<View style={styles.row}>
							<Text style={styles.label}>Service Charge</Text>
							<Text style={styles.price}>₹{serviceCharge.toFixed(2)}</Text>
						</View>
					)}
					{(raw.service_charge ?? raw.serviceCharge ?? 0) !== 0 && (<Pressable onPress={() => setIncludeServiceCharge((prev: boolean) => !prev)}>
						<Text style={{ color: "orange", marginTop: 10 }}>
							{includeServiceCharge ? "Remove Service Charge" : "Add Service Charge"}
						</Text>
					</Pressable>
					)}

					<View style={styles.row}>
						<Text style={styles.label}>Tips</Text>
						{isEditingTip ? (
							<View style={[styles.input, { gap: 8, paddingVertical: 8}]}>
								<TextInput 
									style={[{ color: "#fff", borderBottomWidth: 1, borderColor: "#888" }]}
									onChangeText={setTempTipInput}
									placeholder="Enter tip value"
									placeholderTextColor="#888"
									value={tempTipInput}
									keyboardType="numeric"
									autoFocus
								/>
								<View style={{ flexDirection: "row", justifyContent: "space-between", gap: 20 }}>
									<Pressable
										hitSlop={10}
										onPress={() => {
											setIsEditingTip(false);
											setTempTipInput("");
										}}
									>
										<Text style={{ color: "red" }}>Cancel</Text>
									</Pressable>

									<Pressable
										hitSlop={10}
										onPress={() => {
											const paresdTip = parseFloat(tempTipInput);
											if (isNaN(paresdTip) || paresdTip < 0 || paresdTip > 9999) {
												Alert.alert("Invalid input", "Enter a valid number.",
													[{ text: "OK" }],
													{cancelable: true,});
												return;
											}
											setIsEditingTip(false);
											setTipInput(paresdTip.toFixed(2));
										}}
									>
										<Text style={{ color: "#10B981" }}>Save</Text>
									</Pressable>
								</View>
							</View>
						) : (
							<Pressable 
								onPress={() => {
									setTempTipInput(tipInput || finalTip.toFixed(2));
									setIsEditingTip(true)
								}}
							>
								<Text style={styles.price}>
									₹{finalTip.toFixed(2)}
								</Text>
							</Pressable>
						)}
					</View>

					{/* Divider */}
					<View style={styles.divider} />

					{/* 🔥 TOTAL */}
					<View style={[styles.row, {marginBottom: 20}]}>
						<Text style={styles.totalText}>Total</Text>
						<Text style={styles.totalText}>₹{total.toFixed(2)}</Text>
					</View>
				</View>

				<View style={styles.footer}>
					<Text style={styles.footerText}>
						Review the detected items 
					</Text>
					<Text style={styles.footerText}>
						Tap any item to edit or correct it
					</Text>
				</View>
			</View>
		)}
		
		<View style={{ alignItems: "center" }}>
			<Pressable
				onPress={() => {
					if (itemsState.length === 0) {
					Alert.alert("No items", "Please add at least one item.",
						[{ text: "OK" }],
						{cancelable: true,});
					return;
					}
					
					if (isEdit) {
						router.push({ pathname: "/assignment", 
							params: { data: JSON.stringify(updatedData), 
								groupId: String(editMetadata.groupId) 
						} });
					}
					else if (Number(groupId) === -1) {
						router.push({
							pathname: "/groupInput",
							params: {
								data: JSON.stringify(updatedData),
							},
							});
					}
					else {
						router.push({
							pathname: "/assignment",
							params: {
								data: JSON.stringify(updatedData),
								groupId: String(groupId),
							},
						});
					}
				}}
				style={{
					...styles.next,
					opacity: itemsState.length === 0 ? 0.5 : 1,
				}}
				>
				<Text style={styles.nextText}>
					Looks Good {"\n"} →
				</Text>
			</Pressable>
		</View>
	  </ScrollView>
	</>
  );
}

const styles = StyleSheet.create({
	scrollView: {
    	backgroundColor: '#0F172A',
  	},
	card: {
		width: "90%",
		backgroundColor: "#334155",
		borderRadius: 20,
		overflow: "hidden",
		paddingHorizontal: 20,
		marginTop: 20,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 15,
		marginTop: 16,
	},
	itemName: {
		color: "#fff",
		fontSize: 16,
		flex: 1,
	},
	label: {
		color: "#cbd5f5",
		fontSize: 14,
	},
	price: {
		color: "#fff",
		fontSize: 16,
		marginLeft: 10,
	},
	totalText: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "600",
	},
	divider: {
		height: 1,
		backgroundColor: "#cbd5f5",
		marginVertical: 16,
	},
	footer: {
		justifyContent: "center", 
		alignItems: "center", 
		marginVertical: 28,
	},
	footerText: {
		color: "#cbd5f5", 
		fontSize: 16,
		textAlign: "center",
	},
	next: {
		width: "50%",
		backgroundColor: "#10B981",
		borderRadius: 20,
		overflow: "hidden",
		paddingHorizontal: 20,
		paddingVertical: 10,
	},
	nextText: {
		color: "#fff", 
		fontSize: 20,
		fontWeight: "600",
		textAlign: "center",
	},
	container: {
		padding: 12,
		backgroundColor: "#1f2937",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#436FAD",
		alignItems: "center", 
		justifyContent: "space-between", 
		gap: 20,
	},
	input: {
		backgroundColor: "#111827",
		color: "#fff",
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	actions: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 20,
	},
})