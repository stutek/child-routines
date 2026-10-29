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
- **Ne zahtevaj drže, ki je kopija.** Zobek, ki drži ščetko nad glavo, s peno na vrhu, je bil skoraj enak obstoječemu klipartu (Pngtree 2020, Pikbest 2019) in je odstranjen.
- **Največ 3 referenčne slike na sliko.** Orodje za slike v Antigravityju četrto zavrne, njegov podagent pa nato eno izpusti po svoji presoji in poskusi znova. Navedi največ 3, najpomembnejšo prvo, reference za `.json` pa vzemi iz klica, ki je sliko ustvaril, ne iz agentovega povzetka.
- **Pokaži dejanje, ne rezultata.** »Pripravi mizo« so ročice, ki polagajo pribor ob prazen krožnik, ne krožnik s hrano (to bi bila večerja).
- **Bogato, a berljivo.** Resničen prostor z nekaj domačimi podrobnostmi, nikoli prazen; pri 4 cm glavni motiv zapolni večino slike, ozadje ostane mirno (največ 3 do 4 podrobnosti). Nikjer črk ali številk, tudi ne na igračah ali urah.
- **Koraki naj se ločijo.** »Pospravi mizo« ne sme kazati korita s pipo, ker to že kaže »umij roke«. Zaprte oči ima le slika spanja; ob prebujanju so oči široko odprte.
- **Kdo opravi dejanje (začasno, do odziva bete).** Korak kaže dejanje, ki ga opravi eden od treh:
  - otrokove roke v pogledu z otrokovimi očmi, od spodnjega roba, kjer otrok svoje dejanje vidi sam (umij roke, pripravi in pospravi mizo, pižama, oblačenje, žlica k ustom); nikoli roke brez telesa od drugod;
  - medvedek, kjer dejanja z otrokovih oči ni videti (vstajanje, zobki, postiljanje, pospravljanje igrač, obuvanje pri vratih, spanje);
  - le prostor ali predmeti pri zasebnih ali odraslih korakih (stranišče, kopel, zdravila in nega).
- **Blago se podreja teži.** Oblačila, odeje in brisače visijo, se gubijo in polegajo; nikoli ne stojijo toge kot deska. Otrok ne nosi že tega, kar si oblači.
- **Isti svet.** Kopanje in zobki so v isti kopalnici kot stranišče; isti medvedek se zbuja, pospravlja posteljo, pospravlja igrače in spi. Progasto čepico nosi le ob spanju (dobro jutro, pospravi posteljo, spanje); drugod je brez nje. Popravek skupnega prostora (ploščice na obeh stenah) gre v vse slike tega prostora: primerjaj jih drugo ob drugi.
- **Pokaži dobre navade.** Slike kažejo varno, zdravo vedenje, nikoli slabega zgleda: sedež je daleč od zaslona, nikoli tik ob njem.
- **Brez lažnih obljub.** Ne kaži hrane, ki je otrok ne bo dobil (palačinke za zajtrk doma, ko je zajtrk v vrtcu).
- **Pred uporabo preveri** kontrast (glej AGENTS.sl.md) in avtorstvo na surovi in končni datoteki (`.agents/skills/copyright-check/`).
