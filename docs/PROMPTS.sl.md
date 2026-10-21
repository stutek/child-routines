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
- **Pokaži dejanje, ne rezultata.** »Pripravi mizo« so ročice, ki polagajo pribor ob prazen krožnik, ne krožnik s hrano (to bi bila večerja).
- **Toliko podrobnosti kot najboljše slike.** Prazen prostor (gole stene, preprosti predmeti) ob drugih slikah deluje nedokončano; zahtevaj bogato stran slikanice z veliko domačimi podrobnostmi.
- **Koraki naj se ločijo.** »Pospravi mizo« ne sme kazati korita s pipo, ker to že kaže »umij roke«.
- **Brez rok brez telesa.** Roke so le v pogledu z otrokovimi očmi, ko pridejo od spodnjega roba (pripravi mizo, pospravi mizo, pižama). Sicer dejanje opravi medvedek (pospravi posteljo, pospravi igrače).
- **Isti svet.** Kopanje in zobki so v isti kopalnici kot stranišče; isti medvedek se zbuja, pospravlja posteljo, pospravlja igrače in spi.
- **Brez lažnih obljub.** Ne kaži hrane, ki je otrok ne bo dobil (palačinke za zajtrk doma, ko je zajtrk v vrtcu).
- **Pred uporabo preveri** kontrast (glej AGENTS.sl.md) in avtorstvo na surovi in končni datoteki (`.agents/skills/copyright-check/`).
