import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { Item } from "@/types/item";

import React from "react";

type Props = {
  item: Item;
  onSave: (updatedItem: Item) => void;
  onCancel: () => void;
};

export default function Edit({ item, onSave, onCancel }: Props) {

  const [qty, setQty] = React.useState(String(item.qty));
  const [price, setPrice] = React.useState(String(item.unit_price));
  const [name, setName] = React.useState(String(item.name));
  const parsedQty = parseInt(qty);
  const parsedPrice = parseFloat(price);
  const safeQty = !isNaN(parsedQty) && parsedQty > 0 ? parsedQty : 1;
  const safePrice = !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;	
  const trimmedName = name.trim().slice(0, 30);
  const isValid =
    trimmedName.length > 0 &&
    !isNaN(parsedQty) &&
    parsedQty > 0 &&
    !isNaN(parsedPrice) &&
    parsedPrice >= 0;

  const handleSave = () => {
    if (!trimmedName) {
      Alert.alert("Invalid Name", "Item name cannot be empty.");
      return;
    }

    onSave({
      ...item,
      name: trimmedName,
      qty: safeQty,
      unit_price: safePrice,
      total_price: safeQty * safePrice,
    });
  };


  return (
    <View style={styles.container}>
      <View style={{flex: 1, marginBottom: 5}}>
          <Text style={[styles.label, {paddingHorizontal: 2}]}>Item Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            keyboardType="default"
            style={styles.input}
            returnKeyType="done"
          />
        </View>

      <View style={styles.row}>
        <View style={{flex: 1}}>
          <Text style={[styles.label, {paddingHorizontal: 2}]}>Quantity</Text>
          <TextInput
          value={qty}
          onChangeText={setQty}
          keyboardType="numeric"
          style={styles.input}
          returnKeyType="done"
          />
        </View>
	
        <View style={{flex: 1}}>
          <Text style={[styles.label, {paddingHorizontal: 2}]}>Unit Price</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            style={styles.input}
            returnKeyType="done"
          />
        </View>
      </View>

	  <Text style={{ color: "#9ca3af", marginTop: 8 }}>
  		Total: ₹{(safeQty * safePrice).toFixed(2)}
	  </Text>

      <View style={styles.actions}>
        <Pressable onPress={onCancel}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>

        <Pressable disabled={!isValid} style={{ opacity: isValid ? 1 : 0.5 }}
          onPress={handleSave}
        >
          <Text style={[styles.save, !isValid && {opacity: 0.4}]}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#1f2937",
    borderRadius: 12,
    marginTop: 12,
	  borderWidth: 1,
	  borderColor: "#436FAD",
  },
  name: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#111827",
    color: "#fff",
    padding: 8,
    borderRadius: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancel: {
    color: "#f87171",
  },
  save: {
    color: "#34d399",
    fontWeight: "600",
  },
  label: {
	color: "#9ca3af",
	fontSize: 12,
	marginBottom: 4,
  },
});