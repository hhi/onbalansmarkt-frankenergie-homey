# onbalansmarkt-frankenergie-homey

Homey oplossing voor rapportage op http://onbalansmarkt.com:
- Sessy thuisbatterijsysteem (1 tot n batterijen) 
- Frank Energie

Voorbeeld:
![hhi-onbalans](./hhi-onbalansmarkt.png)


De repository bevat de benodigde Homeyscripts waarmee je een Advanced Flow kunt maken, zodat je onbalans resultaat periodiek (instelbaar) via de API kunt rapporteren naar http://onbalansmarkt.com.

Je hebt naast je account creditionals van je energiemaatschappij ook een API key nodig die je op kunt vragen na aanmelding bij Onbalansmarkt.

Enkele features waarmeer het script is uitgebreid:
- rapportage over de gehele batterijcollectie aan Sessy's;
- rapportage van de actuele batterijpercentage;
- rapportage van de dan geldende Kwhs geladen en kWh ontladen waarden; 
- scripting is geanonimiseerd door login credentionals en de benodigde API-key extern aan het script aan te bieden;
- periode instelbaar van upload van de data naar onbalansmarkt.com

De scripting in deze repository is geschikt gemaakt voor rapportage over meerdere Sessy's. 

Onderstaand de screenshot hoe de gebruiker een Homey Advanced Flow kan maken. Helaas biedt Homey geen makkelijke manier aan om dit soort flows te exporteren cq importeren. Dit is handwerk en vergt kennis van hoe je een Advanced Flow kunt designen. 


![Homey-FrankEnergie](./Homey-FrankEnergie.png)


De Sessy API zelf biedt notabene geen dagtotalen. Dit is opgelost met een delta correctie t.o.v. voorgaande dag.
Instelbaar welke periode (om de 15 minuten in dit voorbeeld) wordt de API van onbalansmarkt.com gevoed met nieuwe gegevens. 

Op de tijdlijn krijgt de Homey gebruiker een feed te zien van aangeleverde baterijpercentage en de(ont)laad kWhs. De scripting is relatief eenvoudig aan te passen voor andere batterijsystemen dan Sessy.

De login/password combinatie kan de gebruiker zelf opvoeren als Homey Flow variabele, zodat het script voortaan geen wijziging behoeft. Zie hiervoor onderstaand screenshot want de naamgeving en de manier van doorgeven moet overeenkomstig zijn.

![Homey-variabelen](./Homey-variabelen.png)
