# Prispevki

[English](CONTRIBUTING.md) · **Slovenščina**

Hvala, ker delite rutino svojega otroka. Dodate lahko **rutino** (novo ali prevod), **slike** ali oboje. Spremembe pošljete kot zahtevo za združitev (pull request).

## Osnovna pravila

- **Brez resničnih oseb.** Brez fotografij otrok ali odraslih, brez imen, brez obrazov resničnih ljudi.
- **Brez napisov na slikah**, brez znamk, logotipov, zastav ali znanih likov (risanke, filmi, blagovne znamke igrač).
- **Le slike, ki jih smete podariti.** Slike, ki ste jih sami ustvarili z modelom za slike ali sami narisali. Nikoli slik s spleta, iz zbirk ali njihovih predelav.
- Vse, kar dodate, je dano v javno last po [CC0 1.0](LICENSE).

## Dodajanje rutine

1. Kopirajte datoteko iz `routines/<jezik>/` v `routines/<vaš jezik>/<ime>.json` (koda jezika, na primer `sl`, `en`, `de`; ime z malimi črkami in vezaji).
2. Uredite jo; oblika je opisana v [angleški različici](CONTRIBUTING.md#add-a-routine):
   - `sky`: `dawn`, `afternoon`, `night`, lasten CSS preliv ali `white` oziroma `none` (prosojno).
   - `stars`: `true` doda zvezdice (za nočne liste).
   - `times`: `false` izpusti polja za uro na tem listu.
   - Največ 8 korakov na list, najlepše je 6 do 7. Dolge rutine razdelite na več listov.
   - `label`: kratko, z velikimi črkami, kjer gre z eno besedo, največ okoli 17 znakov.
   - `image`: oznaka slike iz `images/` ali `null` za prazno polje.
   - `time`: neobvezno, na primer `"07:30"`; natisne se namesto praznega polja za uro.
   - `color`: barva koraka; napis se samodejno potemni za berljiv kontrast.
3. Poženite `python3 tools/check_images.py` in `python3 tools/build.py`, odprite novo datoteko v `output/` in jo preverite v predogledu tiskanja v Chromu.
4. Commitajte rutino in na novo zgrajeno datoteko v `output/`.

## Dodajanje slike

1. Ustvarite kvadratno sliko po [docs/PROMPTS.sl.md](docs/PROMPTS.sl.md) (isti akvarelni slog, resnični prostori, brez oblakov razen ponoči, brez napisov). Shranite jo kot `images/<oznaka>.jpg`, 1024 × 1024 slikovnih pik, JPEG, največ 1,5 MB. Oznaka je angleška, z malimi črkami in vezaji, na primer `brush-teeth`.
2. Dodajte `images/<oznaka>.json` po zgledu v [angleški različici](CONTRIBUTING.md#add-an-image): model, ključne besede (besede, ki bi jih starš vpisal za ta korak; `beseda*` ujame začetek besede), celoten poziv (natančno prepisan), zgledne slike, urejanje, vaše uporabniško ime na GitHubu, licenca `CC0-1.0` in izid preverbe.
3. Najprej preverite sami z iskanjem po slikah (na primer Google Lens, zavihek *Exact matches*), in sicer surovo sliko iz modela in končno datoteko po urejanju. Če enaka ali skoraj enaka slika na spletu že obstaja, je ne pošljite: ustvarite novo z drugačno kompozicijo. Podrobnosti: [preverba avtorstva](.agents/skills/copyright-check/SKILL.sl.md).

## Vrata za avtorske pravice

Vsaka zahteva za združitev sproži dve samodejni preverbi; obe morata uspeti:

- **validate**: slike in metapodatki, rutine, na novo zgrajen `output/`.
- **copyright-gate**: vsako novo ali spremenjeno sliko poišče na spletu (Google Cloud Vision, Web Detection). Če splet že ima isto sliko, njen del ali stran, ki jo prikazuje, preverba pade in zahteve ni mogoče združiti. Ročnih izjem ni: ustvarite novo sliko z drugačno kompozicijo in jo pošljite znova. Podobne slike ne štejejo, le kopije.

## Z agentom

Agent lahko zgornje korake opravi namesto vas: glejte [Lastna rutina z agentom](README.sl.md#lastna-rutina-z-agentom). Prispevek ostane vaš: preden odprete zahtevo za združitev, sami poglejte vsako sliko in preverite vsako točko kontrolnega seznama. Agent upošteva ista pravila ([AGENTS.sl.md](AGENTS.sl.md)), vrata za avtorske pravice pa njegovo delo preverijo kot vsako drugo.

## Zahteva za združitev

Izpolnite kontrolni seznam v predlogi zahteve. V eni zahtevi naj bo ena rutina ali nekaj povezanih slik.

## Vzdrževalci

- Skrivnost repozitorija `VISION_API_KEY`: ključ API projekta Google Cloud z vklopljenim Cloud Vision API (prvih 1.000 preverb na mesec je brezplačnih). Nastavite jo z `gh secret set VISION_API_KEY`.
- `validate / check` in `copyright-gate / web-match` nastavite kot obvezni preverbi za `main` (nastavitve repozitorija, pravila ali zaščita veje).
- Vrata tečejo na `pull_request_target`, iz osnovne veje. Nikoli jih ne spremenite tako, da bi prevzela ali pognala kodo iz zahteve.
