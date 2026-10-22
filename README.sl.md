# Otroške rutine

[English](README.md) · **Slovenščina**

Listi A4 za tisk z dnevno rutino majhnega otroka: jutro, večerja in spanje. Obesite jih na hladilnik ali drugo kovinsko ploščo. Otrok sledi sličicam in na krog vsakega opravljenega koraka položi magnetek (ali ga odkljuka s pisalom, če list vsakič natisnete na novo). Odrasli preberejo vrstni red in ob vsak korak vpišejo predvideno uro, kar pomaga starim staršem ali varuški, ko otrok prespi pri njih.

## Preizkusite

**[Izdelajte svoj list](https://stutek.github.io/child-routines/web/)** · [Vzorčni listi, pripravljeni za tisk](https://stutek.github.io/child-routines/output/sl-vsakdan.html)

![Trije vzorčni listi: jutro, večerja in spanje](docs/preview.jpg)

1. Odprite izdelovalnik listov. Začne z zgornjim primerom.
2. Izberite tip lista (jutro, popoldne, večer) in vpišite do 8 korakov; prazne vrstice se ne natisnejo. Po želji vpišite uro: prazna ura ostane za ročni vpis, stikalo *Ura na listu* pa polja za uro izklopi. Vsakemu koraku se izbere sličica; kliknite nanjo, da jo zamenjate. Stran opozori, kadar za korak nima sličice ali kadar je napis predolg.
3. Izberite ozadje (preliv barv, belo ali prosojno) in natisnite na A4: robovi *Brez*, merilo 100 %.

Vaši vnosi ostanejo v vašem brskalniku. Listi imajo spodaj 14 mm roba, ker večina domačih tiskalnikov spodnjega roba ne natisne.

## Tisk brez izdelovalnika

1. Prenesite datoteke: na [strani repozitorija](https://github.com/stutek/child-routines) kliknite **Code**, nato **Download ZIP**, in arhiv razširite. Listi potrebujejo mapo `images/` ob mapi `output/`, zato odpiranje posamezne datoteke na GitHubu ne deluje.
2. V Chromu odprite `output/sl-vsakdan.html` ali `web/index.html` za lasten list (deluje tudi brez povezave).
3. Natisnite: papir A4, robovi *Brez*, merilo 100 %.

## Lastna rutina iz datotek

Rutine so podatkovne datoteke v [`routines/<jezik>/`](routines/). Eno kopirajte, spremenite napise, sličice in barve, nato znova zgradite:

```bash
pip install -r requirements.txt
python3 tools/check_images.py   # preveri slike in rutine
python3 tools/build.py          # zapiše output/<jezik>-<ime>.html
```

Slike so v [`images/`](images/), vsaka s svojo datoteko metapodatkov. Kako ustvariti nove: [docs/PROMPTS.sl.md](docs/PROMPTS.sl.md).

## Lastna rutina z agentom

Agent z umetno inteligenco (Claude Code, Codex, Gemini CLI ali Antigravity) lahko rutino sestavi namesto vas. Navodila repozitorija v [AGENTS.sl.md](AGENTS.sl.md) naloži sam.

1. Repozitorij prenesite na računalnik (`git clone https://github.com/stutek/child-routines.git` ali ZIP zgoraj) in agenta zaženite v njegovi mapi.
2. Rutino opišite s svojimi besedami, na primer:

   ```text
   V routines/sl/nasa.json sestavi rutino za mojega štiriletnega otroka: jutro (bujenje, stranišče, umivanje rok, zobki, oblačenje, vrtec) in večer (kopanje, pižama, zobki, pravljica, spanje). Kjer se ujemajo, uporabi obstoječe slike, znova zgradi in natisni v PDF, da ga pregledam.
   ```

3. Izid preverite sami v predogledu tiskanja v Chromu: vsak napis je cel, vrstni red je pravi, vsaka slika se ujema s svojim korakom.

Priporočila:

- **Osebni podatki ostanejo doma.** Otrokovo ime na lastnem listu je na vašem računalniku v redu; ne commitajte ga v javno kopijo (fork) ali zahtevo za združitev.
- **Najprej uporabite obstoječe slike.** Mnogi agenti za programiranje slik ne znajo ustvariti; za nove je potreben model za slike (te v repozitoriju so nastale z Google Gemini prek Antigravity), po [docs/PROMPTS.sl.md](docs/PROMPTS.sl.md) in [preverbi avtorstva](.agents/skills/copyright-check/SKILL.sl.md). Vsako novo sliko poglejte sami, preden jo natisnete ali delite: modeli se motijo, na primer narišejo roke brez telesa.
- **Agent naj ne objavlja.** Spremembe preglejte, preden jih pushate ali odprete zahtevo za združitev.

## Prispevki

Starši lahko dodajo rutine, prevode in slike: glejte [CONTRIBUTING.sl.md](CONTRIBUTING.sl.md). Vsaka nova slika mora pred združitvijo prestati samodejna vrata za avtorske pravice.

## Magnetki in varnost

Majhni magneti so nevarni, če otrok pogoltne več kosov. Uporabite magnetke, večje od 32 mm v vsaki smeri (krogi merijo 35 mm), vdelane v plastiko, ne majhnih neodimovih magnetov, in majhne otroke nadzorujte.

## Licenca

Vsa vsebina repozitorija (koda, slike, besedila rutin, dokumentacija) je dana v javno last po [CC0 1.0](LICENSE). Smete jo kopirati, spreminjati in uporabljati za kateri koli namen, brez vprašanja in brez navedbe avtorja. Slike so ustvarjene z modelom za slike; take slike najverjetneje niso avtorsko zaščitene, CC0 pa to pove naravnost, namesto da bi zahteval pravice, ki jih morda ni.

Za agente: [AGENTS.sl.md](AGENTS.sl.md).
