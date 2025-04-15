// Gemiddelde waarden van specifieke apparaten lezen en opslaan

async function getVariableValue(name, defaultValue) {
  const variable = await global.get(name);
  return variable !== undefined ? variable : defaultValue;
}

async function setVariableValue(name, value) {
  await tag(name, value);
  await global.set(name, value);
}

// Zoek naar apparaten met de driverId die "sessy" bevat en de klasse "battery"
const devices = await Homey.devices.getDevices()
  .then(devices => Object.values(devices)
  .filter(device => device.driverId.toLowerCase().includes('sessy') && device.class === 'battery'));

if (devices.length === 0) {
  throw new Error('Geen apparaten gevonden met driverId die "sessy" bevat en class "battery"');
}

// Initialiseer variabelen voor het opslaan van de totale waarden en het aantal geldige apparaten
let totalImportPower = 0;
let totalExportPower = 0;
let totalBatteryLevel = 0;
let validDevices = 0;

for (const device of devices) {
  // Lees de waarden van de capabilities uit
  const importPower = device.capabilitiesObj['meter_power.import']?.value;
  const exportPower = device.capabilitiesObj['meter_power.export']?.value;
  const batteryLevel = device.capabilitiesObj['measure_battery']?.value;

  if (importPower !== undefined && exportPower !== undefined && batteryLevel !== undefined) {
    totalImportPower += importPower;
    totalExportPower += exportPower;
    totalBatteryLevel += batteryLevel;
    validDevices++;
  } else {
    console.error(`Waarden voor apparaat ${device.name} zijn niet geldig`);
  }
}

if (validDevices > 0) { 
  // Bereken de gemiddelde waarden
  const averageImportPower = totalImportPower / validDevices;
  const averageExportPower = totalExportPower / validDevices;
  const averageBatteryLevel = totalBatteryLevel / validDevices;


  // Log de gemiddelde waarden
  console.log(`Gemiddelde meter_power.import: ${averageImportPower}`);
  console.log(`Gemiddelde meter_power.export: ${averageExportPower}`);
  console.log(`Gemiddelde measure_battery: ${averageBatteryLevel}`);

  // Sla de gemiddelde waarden op in globale variabelen
  await setVariableValue('averageImportPower', averageImportPower);
  await setVariableValue('averageExportPower', averageExportPower);
  await setVariableValue('averageBatteryLevel', Math.round(averageBatteryLevel) );

  // Haal de opgeslagen waarden op en log ze
  const storedAverageImportPower = await getVariableValue('averageImportPower', 0);
  const storedAverageExportPower = await getVariableValue('averageExportPower', 0);
  const storedAverageBatteryLevel = await getVariableValue('averageBatteryLevel', 0);

  console.log(`Opgeslagen gemiddelde meter_power.import: ${storedAverageImportPower}`);
  console.log(`Opgeslagen gemiddelde meter_power.export: ${storedAverageExportPower}`);
  console.log(`Opgeslagen gemiddelde measure_battery: ${storedAverageBatteryLevel}`);
} else {
  console.error('Geen geldige apparaten gevonden om de waarden uit te lezen');
}