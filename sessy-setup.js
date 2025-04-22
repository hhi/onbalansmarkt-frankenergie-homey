async function getVariableValue(name, defaultValue) {
    const variable = await global.get(name);
    return variable !== undefined ? variable : defaultValue;
}

async function setVariableValue(name, value) {
    await tag(name, value);
    await global.set(name, value);
}

// bepaal de device capabilities per battery systeem
await setVariableValue('battery_system', 'sessy');
console.log('battery_system:', await getVariableValue('battery_system', 'default'));

await setVariableValue('battery_import', 'meter_power.import');
console.log('battery_import:', await getVariableValue('battery_import', 'default'));

await setVariableValue('battery_export', 'meter_power.export');
console.log('battery_export:', await getVariableValue('battery_export', 'default'));

await setVariableValue('battery_level', 'measure_battery');
console.log('battery_level:', await getVariableValue('battery_level', 'default'));


