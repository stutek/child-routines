# Navodila za agente

[English](AGENTS.md) · **Slovenščina**

Listi A4 za tisk z rutino majhnega otroka (jutro, dan, večer). Visijo na hladilniku; otrok sledi sličicam in na krog opravljenega koraka položi magnetek, odrasli preberejo vrstni red in predvideno uro. Javni repozitorij: brez imen in fotografij resničnih oseb.

## Datoteke

| Pot                               | Vsebina                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `routines/<jezik>/<ime>.json`     | Rutina: listi, vsak z naslovom, nebom in koraki (napis, oznaka slike, barva). |
| `images/<oznaka>.jpg` + `.json`   | Slika 1024 × 1024 in metapodatki (model, poziv, ključne besede, preverba).    |
| `images/README.md`                | Galerija vseh slik, zgradi jo `tools/build.py`.                               |
| `output/<jezik>-<ime>.html`       | Zgrajeni listi za tisk. Nikoli jih ne urejaj ročno.                           |
| `web/`                            | Izdelovalnik listov v brskalniku (`index.html`, `app.js`).                    |
| `tools/build.py`                  | Generator: rutine → output in `web/data.js` za izdelovalnik listov.           |
| `tools/check_images.py`           | Preverba, ki teče v CI.                                                       |
| `tools/copyright_check.py`        | Vrata za avtorske pravice (Vision Web Detection).                             |
| `tools/lens_check.py`             | Ročna preverba z Google Lens prek razhroščevalnega Chroma.                    |
| `docs/PROMPTS.md`                 | Slog slik, pozivi in izkušnje.                                                |
| `.agents/skills/copyright-check/` | Kako preveriti slike pred dodajanjem ali združitvijo.                         |
| `docs/copyright-investigations/`  | Zapis vsakega ujemanja slike, ki je zahtevalo natančnejši pregled.            |

## Ukazi

```bash
pip install -r requirements.txt
python3 tools/check_images.py   # mora izpisati 0 napak
python3 tools/build.py          # po vsaki spremembi rutin ali slik znova zgradi output/
python3 tools/preview.py        # nato osveži docs/preview.jpg (README); potrebuje Chrome in pdftoppm
```

Spremembo preveri vizualno: datoteko iz `output/` z brezglavim Chromom natisni v PDF in jo poglej (`google-chrome --headless=new --print-to-pdf=out.pdf file://$PWD/output/<datoteka>.html`).

Dotik v izdelovalniku (CDP `Input.dispatchTouchEvent`) preizkusi v brezglavem Chromu in s ciljem, pomaknjenim v vidno polje: okno Chroma v ozadju ne izrisuje slik, zato se klic nikoli ne vrne. Vodoravno prelivanje preveri proti širini emulirane naprave (390, 320), ne proti `innerWidth`: pri emulaciji telefona se okno razširi z vsebino.

## Postavitev in njene meje

- Korak je en predmet: kvadratna slika (58 mm; 56 mm pri 8 korakih, večja pri 5 korakih ali manj: 71,5, 81, 98,5 mm pri 5, 4, 3 ali manj; pravilo `layout()` v `tools/build.py`) in okvir (84 × 18 mm) z napisom in poljem za uro (`__ : __`), ob tem krog 35 mm za magnetek tik ob sliki, da otrok poveže sliko in magnetek. Vse mere so spremenljivke CSS iz velikosti papirja (`--page-w`, `--page-h`, `--img`, `--label` v `tools/build.py`); zdaj A4, kasneje ameriški Letter s spremembo spremenljivk strani. Slika, okvir in krog imajo skupen obris in ozadje; ozadje okvirja je barva pasu slike, ki se preliva v okvir (notranjih 12 % v višini okvirja, ločeno za levi in desni rob, brez najtemnejše četrtine pik, pretemna se posvetli v pastelno), ki jo izmeri generator.
- Slike se izmenjujejo levo in desno; prva slika se začne na zgornjem robu, zadnja se konča 1,5 mm nad nogo, središča so vmes enakomerno razmaknjena (brez praznega pasu). Naslov je v zgornji vrsti desno od slike 1, poravnan desno, od 3 mm desno od slike 1 do desnega roba (`title_space()` v `tools/build.py`); če ne bi bil vsaj 3 mm od kroga za magnetek koraka 1 (vrh kroga = slika/2 - 17,5 mm; 6 do 8 korakov), se pas začne 3 mm desno od tega kroga. Pisava 21 pt, pri dolgem naslovu manjša, da stane v pas (`title_size()`), in se prelomi, ne prestopi. Velikost je večja od obeh načinov, zaokrožena navzdol na 0,5 mm, 3 mm razmika med predmeti. Ozki okvirji (6 do 8 korakov): slike na isti strani ohranijo razmik, slika + okvir + slika = 200 mm. Široki okvirji (`.rt-wide`, 5 korakov ali manj): okvir teče od svoje slike do skrajnega roba lista prek nasprotnega stolpca, zato mora naslednja slika odmakniti (razdalja središč vsaj slika/2 + 9 mm + razmik), slika, širša od 81 mm, pa mora odmakniti tudi krog soseda; največ 98,5 mm, da stolpca ohranita razmik. Značke s številkami (10 mm) so koncentrične s kotom slike (polmer 7 mm = polmer značke + 1 mm razmika + obroba), po pravilu za gnezdene kote. Pri ozkih okvirjih je omejitev širina: slika + okvir + slika = 200 mm (A4 brez 5 mm stranskih robov); vsak mm slike vzame 2 mm okvirju in napisu, ker okvir seže v višino nasprotne slike.
- Noga 14 mm nad spodnjim robom nosi licenco (CC0), naslov in QR kodo (`web/qr.svg`, naredi jo `tools/qr.py`; znova le ob spremembi naslova).
- Robovi 5 mm zgoraj in ob straneh, 14 mm spodaj: veliko domačih tiskalnikov spodnjega roba ne natisne. Starejši in profesionalni Epsoni potrebujejo 14 mm za posamezne liste (priročnik Epson SureColor), HP DeskJet okoli 12,7 mm (HP Community, DeskJet 2700); novejši Epsoni zmorejo 3 mm. Nogo (QR kodo) drži nad 14 mm.
- `sheetHtml()` v `web/app.js` zrcali `sheet_html()` v `tools/build.py`: spreminjaj ju skupaj. `web/data.js` je zgrajen; nikoli ga ne urejaj.
- Napisi se ne prelamljajo. 13 pt krepko z velikimi črkami sprejme okoli 17 znakov (`POSPRAVI POSTELJO`, 44,2 od 45,0 mm). Po spremembi napisov v brezglavem Chromu izmeri, da `scrollWidth` vsakega napisa ne preseže širine okvirja brez kroga za magnetek, robov in razmika (starš `.rt-text` se širi z napisom, zato ni merilo; pravilno to dela `labelRoom()` v `web/app.js`).
- Barva napisa se samodejno potemni do kontrasta vsaj 4,5 : 1 z okvirjem (WCAG 2.2, 1.4.3).
- 6 do 7 korakov na list (največ 8). Dolge rutine razdeli na več listov, namesto da bi manjšal slike.

## Slike

- Upoštevaj `docs/PROMPTS.md`: en akvarelni slog, resnični prostori, brez oblakov (razen ponoči), brez napisov, znamk, zastav ali znanih likov. Ustvarjaj; nikoli ne sestavljaj slike iz prilepljenih delov s kodo.
- Modeli za slike pogosto dajo blede slike. Kontrast povečaj enkrat s Pillow: `ImageOps.autocontrast(cutoff=(0.5, 0.3))`, `ImageEnhance.Contrast(1.1)`, `ImageEnhance.Color(1.12)`, `UnsharpMask(radius=2, percent=50, threshold=3)`. Obrezuj v datoteki, ne s CSS, da se barva roba izmeri na vidnem robu.
- Poziv in zgledne slike prepiši v `.json` slike natanko tako, kot sta šla modelu (iz klica orodja), nikoli obnovljena iz `docs/PROMPTS.md`. Kar ni znano, ostane `unknown`.
- Pred dodajanjem vsake slike upoštevaj veščino `.agents/skills/copyright-check/` na surovi in končni datoteki ter izid zapiši v njen `.json`.

## Pravila

- Repozitorij je samozadosten: vse, kar agent potrebuje (pravila, veščine, orodja), je v njem, in nič se ne sklicuje na datoteke zunaj njega. `CLAUDE.md` in `GEMINI.md` le uvozita to datoteko (angleško različico).
- Nikoli ne oslabi vrat za avtorske pravice (`.github/workflows/copyright-gate.yml`): ostati morajo na `pull_request_target`, ne smejo prevzeti ali pognati kode iz zahteve in morajo ob napaki zavrniti.
- Ko starš sestavlja rutino za svojega otroka, otrokovega imena in drugih osebnih podatkov ne daj v commit ali zahtevo za združitev.
- Primera (`routines/sl/primer.json`, `routines/en/example.json`; izdelovalnik ju naloži) kažeta dobre navade, npr. zaslon vsaj uro pred spanjem (KidsHealth), umite roke pred obrokom, zobje po zadnjem obroku; večer vključuje zdravila in nego, v podporo družinam, ki jih potrebujejo. Slovensko jutro nima zajtrka, ker ga dajo slovenski vrtci; angleško ga ohrani.
- `README`, `CONTRIBUTING` in `AGENTS` drži usklajene v angleščini in slovenščini (`*.sl.md`). `README` je za starše, brez ukazov; gradnja, agenti in prispevki so v `CONTRIBUTING`.
- Razprava strokovnjakov o rutinah ali listih povabi vsaj vzgojitelja Montessori, strokovnjaka za razvoj otrok in strokovnjaka za varnost in označevanje izdelkov za otroke (npr. opozorilni znaki igrač), poleg starša in investitorja; razprava o besedilih za starše povabi še strokovnjaka za prodajo (prodajno besedilo).
- Besedila za starše učinek brez prebranega vira zapišejo kot možnost (»lahko«), nikoli kot dejstvo. Točka, ki jo je vzdrževalec dodal iz prakse (npr. znano zaporedje lahko otroka pomiri, iz otroških knjig o čuječnosti), ostane v taki obliki; pregledi take točke omilijo, ne črtajo.
- Barve so otroške in spolno nevtralne: rumena, oranžna, rdeča, zelena, turkizna in modra kot v igralnici, brez roza in vijoličaste, na listih in v izdelovalniku. Barve korakov ohranijo belo številko pri kontrastu vsaj 3 : 1.
- Magnetki: priporoči 35 mm ali več, vdelane v plastiko; ameriški valj za majhne dele meri 31,7 mm (CPSC 16 CFR 1501). Več pogoltnjenih magnetov se privlači skozi črevesje.
