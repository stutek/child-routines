# Pozivi in slog slik

[English](PROMPTS.md) · **Slovenščina**

Vsaka slika rutine je kvadratna ilustracija 1 : 1, ustvarjena z modelom za slike. Besedilo sloga in pozivi za posamezne slike so v angleščini, ker jih modeli najbolje razumejo: [PROMPTS.md](PROMPTS.md). Ta stran povzame pravila.

## Slog

- Akvarel in gvaš otroške slikanice, nežne obrobe z barvico, topel kremen papir, pastelne barve, a izrazit kontrast.
- Prizor v resničnem, toplem prostoru doma (kopalnica, kuhinja, soba). Brez oblakov in lebdenja; izjema je spanje na nočnem nebu.
- Prijazno za 4-letnika, spolno nevtralno, glavni predmet velik in na sredini, berljiv pri velikosti 4 cm.
- Brez napisov, črk, logotipov, znamk, zastav in znanih likov; vsak lik je izviren.
- Zgleda sloga: `images/toilet.jpg`, `images/wash-hands.jpg`.

## Pravila iz izkušenj

- **Ustvarjaj, ne sestavljaj.** Če model ne uspe (kvota, napaka), se ustavi. Slike ne ponarejaj s Pythonom z lepljenjem ploskih oblik; taki rezultati so bili vsi zavrnjeni.
- **Ne zahtevaj drže, ki je kopija.** Zobek, ki drži ščetko nad glavo, s peno na vrhu, je bil skoraj enak obstoječemu klipartu (Pngtree 2020, Pikbest 2019) in je odstranjen. Prav tako se je medvedek na stopnički pri umivalniku s ščetko pri ustih ujemal s kompletom slik na Etsyju: medvedka, ki umiva zobke, pokaži od spredaj, čez umivalnik.
- **Največ 3 referenčne slike na sliko.** Orodje za slike v Antigravityju četrto zavrne, njegov podagent pa nato eno izpusti po svoji presoji in poskusi znova. Navedi največ 3, najpomembnejšo prvo, reference za `.json` pa vzemi iz klica, ki je sliko ustvaril, ne iz agentovega povzetka. V načinu brez vprašanj branje, ki ni dovoljeno, konča delo brez slike, zato navodilo pove, naj agent ne bere drugih datotek kot referenc.
- **Pokaži dejanje, ne rezultata.** »Pripravi mizo« so ročice, ki polagajo pribor ob prazen krožnik, ne krožnik s hrano (to bi bila večerja).
- **Bogato, a berljivo.** Resničen prostor z nekaj domačimi podrobnostmi, nikoli prazen; pri 4 cm glavni motiv zapolni večino slike, ozadje ostane mirno (največ 3 do 4 podrobnosti). Nikjer črk ali številk, tudi ne na igračah ali urah.
- **Koraki naj se ločijo.** »Pospravi mizo« ne sme kazati korita s pipo, ker to že kaže »umij roke«. Zaprte oči ima le slika spanja; ob prebujanju so oči široko odprte.
- **Dve temi sličic.** Starš izbere eno za ves list: medvedek (`"theme": "bear"`, privzeto) ali brez lika (`"plain"`). Slika koraka ima eno temo in ima lahko različico v drugi (`"variant_of"`, brez lastnih ključnih besed in napisa); brez različice list pokaže sliko, ki jo ima.
  - Medvedek: korak opravi isti medvedek (tudi stranišče in kopel).
  - Brez lika: otrokove roke v pogledu z otrokovimi očmi, od spodnjega roba, kjer otrok svoje dejanje vidi sam (umij roke, pripravi in pospravi mizo, pižama, oblačenje, žlica k ustom, čevlji, krpica, krtača, odeja, igrače v skrinjo); nikoli roke brez telesa od drugod. Sicer le prostor ali predmeti (stranišče, kopel; spanje: postelja ponoči; dobro jutro: postelja v jutranjem soncu). Objem kaže odraslega in otroka z vidnima obrazoma (`hug-plain`): objem dveh oseb brez obrazov je dal odvečne roke, odraslega brez glave ali otroka, ki drži pulover, nikoli jasnega objema.
  - Zdravila in nega kažejo v obeh temah le predmete: zdravilo daje odrasel.
- **Blago se podreja teži.** Oblačila, odeje in brisače visijo, se gubijo in polegajo; nikoli ne stojijo toge kot deska. Otrok ne nosi že tega, kar si oblači. Oblačila sama ne delajo: pokončna majica z dolgimi rokavi in prazno odprtino za vrat se bere kot človek brez glave, ne kot objem; namesto tega pokaži ljudi (obraze zunaj okvirja) ali medvedka.
- **Preštej ude.** Na vsaki sliki preveri vsako osebo in medvedka posebej: natanko dve roki in dve nogi, vsaka pritrjena na svoje telo. Pri objemu navodilo pove, kam gre vsaka roka (»otrokovi roki okoli odraslega v pasu, odraslega roki okoli otrokovega hrbta, nobena roka čez ramo«). Spremenjena slika (bližji pogled, brez obrazov) dobi za vzorec le pravilno sliko: model njene napake prenese v naslednji korak.
- **Isti svet.** Kopanje in zobki so v isti kopalnici kot stranišče; isti medvedek se zbuja, pospravlja posteljo, pospravlja igrače in spi. Progasto čepico nosi le ob spanju (dobro jutro, pospravi posteljo, spanje); drugod je brez nje. Obraz je povsod enak: majhne črne okrogle oči kot gumbki brez beline, majhen črn nos, blag nasmeh. Popravek skupnega prostora (ploščice na obeh stenah) gre v vse slike tega prostora: primerjaj jih drugo ob drugi.
- **Pokaži dobre navade.** Slike kažejo varno, zdravo vedenje, nikoli slabega zgleda: sedež je daleč od zaslona, nikoli tik ob njem.
- **Brez lažnih obljub.** Ne kaži hrane, ki je otrok ne bo dobil (palačinke za zajtrk doma, ko je zajtrk v vrtcu).
- **Pred uporabo preveri** kontrast (glej AGENTS.sl.md) in avtorstvo na surovi in končni datoteki (`.agents/skills/copyright-check/`).
