# onbalansmarkt-frankenergie-homey

Homey oplossing voor live-opbrengst rapportage op https://onbalansmarkt.com:
- Sessy thuisbatterijsysteem (1 tot n batterijen) 
- In experimentele fase, support voor AlphaESS thuisbatterijsysteem waaronder AlphaESS, HomeVolt of via SolarEdge modbus aangestuurde 
- Frank Energie slim handelen account

De scripting in deze repository is geschikt gemaakt voor rapportage over meerdere individuele (Sessy)batterijen wat oorspronkelijk ontbrak in het basisscript.  

Voorbeeld:
![hhi-onbalans](./hhi-onbalansmarkt.png)


De repository bevat de benodigde Homeyscripts waarmee je een Advanced Flow kunt maken, zodat je onbalans resultaat periodiek (instelbaar) via de API kunt rapporteren naar de service.

Je hebt naast je account creditionals van je energiemaatschappij ook een API key nodig die je op kunt vragen na aanmelding bij Onbalansmarkt.


Enkele features waarmeer het basisscript is uitgebreid:
- rapportage over de gehele batterijcollectie aan aanwezige thuisbatterijen;
- rapportage van het actuele batterijpercentage gemiddelde;
- rapportage van de dan geldende Kwhs geladen en kWh ontladen waarden; 
- scripting is geanonimiseerd door login credentionals en de benodigde API-key extern aan het script aan te bieden;
- periode instelbaar van upload van de data naar onbalansmarkt.com;
- het is relatief eenvoudig een ander merk batterij zoals te bevragen, zie de **systeemk**-setup.js als voorbeeld, waarin de benodigde device capabilities per batterij staan waarover gerapporteerd. 


Onderstaand het screenshot hoe de gebruiker een Homey Advanced Flow kan maken. Helaas biedt Homey geen makkelijke manier aan om dit soort flows te exporteren cq importeren. Dit is handwerk en vergt kennis van hoe je een Advanced Flow kunt designen. 
- Sla de inhoud per .js bestand op als Homeyscript, met gelijksoortige naamgeving (naam zonder de extensie);
- Maak de globale variabelen aan (zie verderop);
- Maak de Advanced flow aan met daarbij de 'then' Homeyscipt - as script kaartjes, waarbij je per kaartje de naam van het overeenkomstige bestand kiest;
- Maak voor je eigen batterij (zonodig) een Homey script aan onder de naam  merk-setup.js en verbind deze zoals in het voorbeeld het sessy-setup Homeyscript;
- Door met de muis op de '23:59 kaartje' te staan, is deze afzonderlijk te starten. Voer eventueel eenmalig uit als setup mocht je initieel problemen ondervinden. De geleverde scripts zijn ook afzonderlijk uit te voeren in de Homeyscript (< / >) mode sectie zelf natuurlijk (*handig wat betreft logging output*).


![Homey-FrankEnergie](./Homey-FrankEnergie.png)


De login/password combinatie kan de gebruiker zelf opvoeren als Homey Flow variabele, zodat het script voortaan geen wijziging behoeft. Zie hiervoor onderstaand screenshot want de naamgeving en de manier van doorgeven moet overeenkomstig zijn. Voor het mee kunnen geven van de namen van de variabelen betreft het hier een 'script met argument' kaartje met een explicite komma tussen de variable namen: "frankenergie_id,frankenergie_pw,onbalansmarkt_apikey"

![Homey-variabelen](./Homey-variabelen.png)


De Sessy API (als bijvoorbeeld) levert geen dagtotalen (alleen grand totals). Voor de rapportage per dag is opgelost met een delta gemiddelde te bepalen t.o.v. voorgaande dag.
Instelbaar welke periode (om de 15 minuten in dit voorbeeld) wordt de API van onbalansmarkt.com gevoed met nieuwe gegevens. 

Op de tijdlijn krijgt de Homey gebruiker een feed te zien van aangeleverde baterijpercentage en de naar beneden afgeroden (ont)laad kWhs. Bij de 'teller op nul' notificatie zie je de vorige dag intern opgeslagen waarden.

![Tijdlijn voorbeeld](./Tijdlijn%20voorbeeld.png)


De scripting is relatief eenvoudig aan te passen voor andere batterijsystemen dan Sessy, zoals o.a. de AlphaESS. 
(Zie ook [batterij capabilities](./batteries.pdf))

Bij batterijsystemen die al voorzien in dagtotalen moet de extra delta verwerking stop op 'No' taan. Voor zover nu na te gaan is alleen bij Sessy, AlphaESS en SolarEdge StoreEdge kWh de dag ont(laad)totaal mode van toepassing.
Zie daarvoor de scripts sessy-setup.js, alphaESS-setup.js of sigEnergy-setup.js:

| Systeem | Batterij % | kWh laadtotaal | kWh ontlaadtotaal | Driver-Id | Class | delta verwerking |
|---|---|---|---|---|---|---|
| Sessy | measure_battery | meter_power.import | meter_power.export | sessy | battery | Yes |
| AlphaESS | measure_battery | meter_power.charged | meter_power.discharged | alpaess | battery | Yes |
| ZP Nexus | measure_battery | meter_power.daily_import | meter_power.daily_export |  zonneplan | battery | No |
| Homevolt | measure_battery | meter_power.imported | meter_power.exported | homevolt-battery | battery | Yes |
| SolarEdge SigEnergy | measure_battery | meter_power.daily_charge | meter_power.daily_discharge | sigenergy  | solarpanel | No |
| SolarEdge Solax | measure_battery | meter_power.today_batt_input | meter_power.today_batt_output | solax | solarpanel | No |
| SolarEdge Wattsonic | measure_battery | meter_power.today_batt_input | meter_power.today_batt_output | wattsonic | solarpanel | No |
| SolarEdge Sungrow | measure_battery | meter_power.today_batt_input | meter_power.today_batt_output | sungrow | solarpanel | No |
| SolarEdge Huawei | measure_battery | meter_power.today_batt_input | meter_power.today_batt_output | huawei | solarpanel | No |
| SolarEdge Growatt | measure_battery | meter_power.today_batt_input | meter_power.today_batt_output | growatt | solarpanel | No |
| SolarEdge StoreEdge | measure_battery | meter_power.import | meter_power.export | storeedge | solarpanel | Yes |

De aan SolarEdge Modbus geleerde batterijen worden naar verwachting bevraagd via de 'SolarEdge + Growatt TCP modbus' App. Maak je eigen setup script op basis van bovenstaande waarden en vervang in de flow het 'sessy-setup' kaartje met je eigen homeyscript variant.
