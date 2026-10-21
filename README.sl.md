# Otroške rutine

[English](README.md) · **Slovenščina**

Listi A4 za tisk z dnevno rutino majhnega otroka: jutro, večerja in spanje. Obesite jih na hladilnik ali drugo kovinsko ploščo. Otrok sledi sličicam in na krog vsakega opravljenega koraka položi magnetek (ali ga odkljuka s pisalom, če list vsakič natisnete na novo). Odrasli preberejo vrstni red in ob vsak korak vpišejo predvideno uro, kar pomaga starim staršem ali varuški, ko otrok prespi pri njih.

## Tisk

1. V Chromu odprite datoteko iz [`output/`](output/), na primer `output/sl-vsakdan.html`.
2. Natisnite: papir A4, robovi *Brez*, merilo 100 %. Ozadje z nebom se natisne samo.

Listi imajo spodaj 14 mm roba, ker večina domačih tiskalnikov spodnjega roba ne natisne.

## Lastna rutina

Rutine so podatkovne datoteke v [`routines/<jezik>/`](routines/). Eno kopirajte, spremenite napise, sličice in barve, nato znova zgradite:

```bash
pip install -r requirements.txt
python3 tools/check_images.py   # preveri slike in rutine
python3 tools/build.py          # zapiše output/<jezik>-<ime>.html
```

Slike so v [`images/`](images/), vsaka s svojo datoteko metapodatkov. Kako ustvariti nove: [docs/PROMPTS.sl.md](docs/PROMPTS.sl.md).

## Prispevki

Starši lahko dodajo rutine, prevode in slike: glejte [CONTRIBUTING.sl.md](CONTRIBUTING.sl.md). Vsaka nova slika mora pred združitvijo prestati samodejna vrata za avtorske pravice.

## Magnetki in varnost

Majhni magneti so nevarni, če otrok pogoltne več kosov. Uporabite magnetke, večje od 32 mm v vsaki smeri (krogi merijo 35 mm), vdelane v plastiko, ne majhnih neodimovih magnetov, in majhne otroke nadzorujte.

## Licenca

Vsa vsebina repozitorija (koda, slike, besedila rutin, dokumentacija) je dana v javno last po [CC0 1.0](LICENSE). Smete jo kopirati, spreminjati in uporabljati za kateri koli namen, brez vprašanja in brez navedbe avtorja. Slike so ustvarjene z modelom za slike; take slike najverjetneje niso avtorsko zaščitene, CC0 pa to pove naravnost, namesto da bi zahteval pravice, ki jih morda ni.

Za agente: [AGENTS.sl.md](AGENTS.sl.md).
