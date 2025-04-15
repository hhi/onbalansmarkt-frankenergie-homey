/**
 * JavaScript code om de opbrengst van een batterij naar Onbalansmarkt.com te sturen.
 *
 * Update 2025-01-24: update om impex, Frank Slim korting en totaal handelsresultaat in te sturen.
 * Update 2025-01-23: update naar netto 'totaal kortingsfactuur' ipv bruto resultaat
 *
 * Auteur: erdebee, met wijzigingen van verschillende gebruikers

 *   Update 2025-02-10: hhi, gecombineerd resultaat voor de bijdragende individuele (Sessy) battterijen, met import/export kWhs en batterij-capaciteit

-SESSIE- <ID-EXAMPLE-OUTPUT => {
  "data": {
    "smartBatterySessions": {
      "deviceId": "---ID---",
      "fairUsePolicyVerified": false,
      "periodStartDate": "2025-02-10",
      "periodEndDate": "2025-02-10",
      "periodEpexResult": -0.3212414999999999,       -->  EPEX-correctie                          € -0,32
      "periodFrankSlim": 0.15302999999999994,        -->  Handelsresultaat.Frank Slim Korting      € 0,15
      "periodImbalanceResult": 0.4614773533332047,   -->              ''''.Onbalansresultaat       € 0,46
      "periodTotalResult": 0.2932658533332047,       --> Totaal kortingsfactuur                 € 0,29   
      "periodTradeIndex": null,
      "periodTradingResult": 0.6145073533332046,     -->  Handelsresultaat                       € 0,61
      "sessions": [
        {
          "cumulativeTradingResult": 0.6145073533332046,
          "date": "2025-02-10",
          "tradingResult": 0.6145073533332046,
          "result": 0.6145073533332046,
          "status": "ACTIVE",
          "tradeIndex": null
        }
      ],
      "totalTradingResult": 293.9425048467043
    }
  }
}



 */
const timeZone = 'Europe/Amsterdam';

class FrankEnergie {
  constructor(authToken = null, refreshToken = null) {
    this.DATA_URL = "https://frank-graphql-prod.graphcdn.app/";
    this.auth = authToken || refreshToken ? { authToken, refreshToken } : null;
  }
  
  async query(queryData) {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Homey/FrankV1',
      ...(this.auth && { 'Authorization': `Bearer ${this.auth.authToken}` })
    };
    
    try {
      const response = await fetch(this.DATA_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(queryData)
      });
      
      const data = await response.json();
      
      if (data.errors) {
        for (const error of data.errors) {
          if (error.message === "user-error:auth-not-authorised") {
            throw new Error("Authentication required");
          }
        }
      }
      
      return data;
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
  
  async login(username, password) {
    const query = {
      query: `
                mutation Login($email: String!, $password: String!) {
                    login(email: $email, password: $password) {
                        authToken
                        refreshToken
                    }
                }
            `,
      operationName: "Login",
      variables: { email: username, password }
    };
    
    const response = await this.query(query);
    this.auth = response.data.login;
    return this.auth;
  }
  
  async getPrices(startDate, endDate) {
    const query = {
      query: `
                query MarketPrices($startDate: Date!, $endDate: Date!) {
                    marketPricesElectricity(startDate: $startDate, endDate: $endDate) {
                        from
                        till
                        marketPrice
                        marketPriceTax
                        sourcingMarkupPrice
                        energyTaxPrice
                    }
                    marketPricesGas(startDate: $startDate, endDate: $endDate) {
                        from
                        till
                        marketPrice
                        marketPriceTax
                        sourcingMarkupPrice
                        energyTaxPrice
                    }
                }
            `,
      variables: {
        startDate: new Date(startDate.toLocaleString('en-US', { timeZone })).toISOString().split('T')[0],
        endDate: new Date(endDate.toLocaleString('en-US', { timeZone })).toISOString().split('T')[0]
      },
      operationName: "MarketPrices"
    };
    
    return await this.query(query);
  }
  
  async getSmartBatteries() {
    if (!this.auth) {
      throw new Error("Authentication required");
    }
    
    const query = {
      query: `
                query SmartBatteries {
                    smartBatteries {
                        brand
                        capacity
                        createdAt
                        externalReference
                        id
                        maxChargePower
                        maxDischargePower
                        provider
                        updatedAt
                   }
              }
            `,
      operationName: "SmartBatteries"
    };
    
    return await this.query(query);
  }
  
  async getSmartBatterySessions(deviceId, startDate, endDate) {
    if (!this.auth) {
      throw new Error("Authentication required");
    }
    
    const query = {
      query: `
        query SmartBatterySessions($startDate: String!, $endDate: String!, $deviceId: String!) {
            smartBatterySessions(
                startDate: $startDate
                endDate: $endDate
                deviceId: $deviceId
            ) {
                deviceId
				fairUsePolicyVerified
                periodStartDate
                periodEndDate
                periodEpexResult
                periodFrankSlim
                periodImbalanceResult
                periodTotalResult
                periodTradeIndex
                periodTradingResult
                sessions {
                    cumulativeTradingResult
                    date
                    tradingResult
					result
					status
					tradeIndex
                }
                totalTradingResult
            }
        }
            `,
      operationName: "SmartBatterySessions",
      variables: {
        deviceId,
        startDate: startDate.toLocaleDateString('en-CA', { timeZone: timeZone }), // specificeer de lokale datum in YYYY-mm-dd formaat
        endDate: endDate.toLocaleDateString('en-CA', { timeZone: timeZone })
      }
    };
    
    return await this.query(query);
  }
  
  isAuthenticated() {
    return this.auth !== null;
  }
}

class OnbalansMarkt {
  constructor(apiKey) {
    this.apiUrl = 'https://onbalansmarkt.com/api/live';
    this.apiKey = apiKey;
  }
  
  async sendMeasurement({
                          timestamp,
                          batteryResult,
                          batteryResultTotal,
                          batteryCharge = null,
                          batteryPower = null,
                          chargedToday = null,
                          dischargedToday = null,
                          loadBalancingActive = null,
                          solarResult = null,
                          chargerResult = null,
                          batteryResultEpex = null,
                          batteryResultImbalance = null,
                          batteryResultCustom = null
                        }) {
    // Validate required fields
    if (!timestamp || !batteryResult || !batteryResultTotal) {
      throw new Error('timestamp, batteryResult and batteryResultTotal are required fields');
    }
    

    // Prepare the payload
    const payload = {
      timestamp: timestamp.toISOString(),
      batteryResult: batteryResult.toString(),
      batteryResultTotal: batteryResultTotal.toString(),
      ...(batteryCharge !== null && { batteryCharge: batteryCharge.toString() }),
      ...(batteryPower !== null && { batteryPower: batteryPower.toString() }),
      ...(chargedToday !== null && { chargedToday: chargedToday.toString() }),
      ...(dischargedToday !== null && { dischargedToday: dischargedToday.toString() }),
      ...(loadBalancingActive !== null && { loadBalancingActive: loadBalancingActive.toString() }),
      ...(solarResult !== null && { solarResult: solarResult.toString() }),
      ...(chargerResult !== null && { chargerResult: chargerResult.toString() }),
      ...(batteryResultEpex !== null && { batteryResultEpex: batteryResultEpex.toString() }),
      ...(batteryResultImbalance !== null && { batteryResultImbalance: batteryResultImbalance.toString() }),
      ...(batteryResultCustom !== null && { batteryResultCustom: batteryResultCustom.toString() })
    };
    
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error sending measurement:', error);
      throw error;
    }
  }
}

class HomeyVars {
  async getVariableValue(name, defaultValue) {
    const variable = await global.get(name);
    return variable !== undefined ? variable : defaultValue;
  }

  async setVariableValue(name, value) {
    await tag(name, value);
    await global.set(name, value);
  }
}

const homeyVars = new HomeyVars();

// Lees de variabelen
const frankenergie_pw = await homeyVars.getVariableValue('frankenergie_pw', 'defaultPassword');
const frankenergie_id = await homeyVars.getVariableValue('frankenergie_id', 'defaultEmail');
const onbalansmarkt_apikey = await homeyVars.getVariableValue('onbalansmarkt_apikey', 'defaultApiKey');

// Log de waarden van de variabelen
console.log(`Frank Energie Password: ${frankenergie_pw}`);
console.log(`Frank Energie Login: ${frankenergie_id}`);
console.log(`Onbalansmarkt API Key: ${onbalansmarkt_apikey}`);

const frank = new FrankEnergie();

await frank.login(frankenergie_id, frankenergie_pw);

const onbalansmarkt = new OnbalansMarkt(onbalansmarkt_apikey);


// Get all smart batteries
const batteries = await frank.getSmartBatteries();

// we sturen met dit script de opbrengst van de batterij, op de huidige tijd, naar Onbalansmarkt.com
let currentTime = new Date();

// wanneer je de opgenomen en geleverde kWhs beschikbaar hebt van je batterij, dan kun je die hier ophalen en aan onderstaande variabelen toewijzen.
let kwhCharged  = await homeyVars.getVariableValue('deltaImportPower', null); 
let kwhDischarged = await homeyVars.getVariableValue('deltaExportPower', null);
let battCharged = await homeyVars.getVariableValue('averageBatteryLevel', null);

// Get sessions for a specific battery
// Accumulate results
let accumulatedPeriodTotalResult = 0;
let accumulatedTotalTradingResult = 0;
let accumulatedPeriodEpexResult = 0;
let accumulatedPeriodTradingResult = 0;
let accumulatedPeriodFrankSlim = 0;

// Get sessions for each battery
for (const battery of batteries.data.smartBatteries) {
  const batteryId = battery.id;
  const sessions = await frank.getSmartBatterySessions(
    batteryId,
    currentTime,
    currentTime
  );
  console.log("-SESSIE-",batteryId, "=>",JSON.stringify(sessions,null,2));
  accumulatedPeriodTotalResult += sessions.data.smartBatterySessions.periodTotalResult;
    accumulatedTotalTradingResult += sessions.data.smartBatterySessions.totalTradingResult;
    accumulatedPeriodEpexResult += sessions.data.smartBatterySessions.periodEpexResult;
    accumulatedPeriodTradingResult += sessions.data.smartBatterySessions.periodTradingResult;
    accumulatedPeriodFrankSlim += sessions.data.smartBatterySessions.periodFrankSlim;
}


  
  await onbalansmarkt.sendMeasurement({
    timestamp: currentTime,
     batteryResult: accumulatedPeriodTotalResult,
     batteryResultTotal: accumulatedTotalTradingResult,
	 batteryCharge: battCharged, 
     loadBalancingActive: "off", // Stuur hier enkel 'on' in wanneer de batterij op dit moment beperkt is in zijn vermogen door load balancing
     chargedToday: kwhCharged !== null ? Math.round(kwhCharged) : null,
     dischargedToday: kwhDischarged !== null ? Math.round(kwhDischarged) : null,
     batteryResultEpex: accumulatedPeriodEpexResult,
     batteryResultImbalance: accumulatedPeriodTradingResult,
     batteryResultCustom: accumulatedPeriodFrankSlim
  });

