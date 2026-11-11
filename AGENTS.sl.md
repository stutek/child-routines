# Navodila za agente

[English](AGENTS.md) · **Slovenščina**

Listi A4 za tisk z rutino majhnega otroka (jutro, dan, večer). Visijo na hladilniku; otrok sledi sličicam in na krog opravljenega koraka položi magnetek, odrasli preberejo vrstni red in predvideno uro. Javni repozitorij: brez imen in fotografij resničnih oseb.

## Datoteke

| Pot                               | Vsebina                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `routines/<jezik>/<ime>.json`     | Rutina: listi, vsak z naslovom, nebom in koraki (napis, oznaka slike, barva).    |
| `images/<oznaka>.jpg` + `.json`   | Slika 1024 × 1024 in metapodatki (model, poziv, ključne besede, tema, preverba). |
| `images/README.md`                | Galerija vseh slik, zgradi jo `tools/build.py`.                                  |
| `output/<jezik>-<ime>.html`       | Zgrajeni listi za tisk. Nikoli jih ne urejaj ročno.                              |
| `children/`                       | Izdelovalnik listov v brskalniku (`index.html`, `app.js`).                       |
| `tools/build.py`                  | Generator: rutine → output in `children/data.js` za izdelovalnik listov.         |
| `tools/check_images.py`           | Preverba slik in rutin.                                                          |
| `tools/check.py`                  | Testni pipeline po stopnjah, poženeta ga pre-push hook in GitHub; preverbe sem.  |
| `tools/pdf_test.py`               | Slike ostanejo ostre v tisku (v PDF ni rastrirane slike).                        |
| `.github/workflows/pipeline.yml`  | Stopnja 1 → stopnja 2 → objava na GitHub Pages; edina pot objave strani.         |
| `tools/copyright_check.py`        | Vrata za avtorske pravice (Vision Web Detection).                                |
| `tools/lens_check.py`             | Ročna preverba z Google Lens prek razhroščevalnega Chroma.                       |
| `docs/PROMPTS.md`                 | Slog slik, pozivi in izkušnje.                                                   |
| `.agents/skills/copyright-check/` | Kako preveriti slike pred dodajanjem ali združitvijo.                            |
| `docs/copyright-investigations/`  | Zapis vsakega ujemanja slike, ki je zahtevalo natančnejši pregled.               |

## Ukazi

```bash
pip install -r requirements.txt
git config core.hooksPath .githooks   # enkrat na klon: git push najprej požene tools/check.py
python3 tools/check.py          # vsi testi po stopnjah (okoli 2 min); stran se objavi le, če uspejo na GitHubu
python3 tools/check_images.py   # mora izpisati 0 napak
python3 tools/build.py          # po vsaki spremembi rutin ali slik znova zgradi output/
python3 tools/preview.py        # nato osveži docs/preview.jpg (README); potrebuje Chrome in pdftoppm
```

Spremembo preveri vizualno: datoteko iz `output/` z brezglavim Chromom natisni v PDF in jo poglej (`google-chrome --headless=new --print-to-pdf=out.pdf file://$PWD/output/<datoteka>.html`).

Dotik v izdelovalniku (CDP `Input.dispatchTouchEvent`) preizkusi v brezglavem Chromu in s ciljem, pomaknjenim v vidno polje: okno Chroma v ozadju ne izrisuje slik, zato se klic nikoli ne vrne. Vodoravno prelivanje preveri proti širini emulirane naprave (390, 320), ne proti `innerWidth`: pri emulaciji telefona se okno razširi z vsebino.

## Postavitev in njene meje

- Korak je en predmet: kvadratna slika (58 mm; 55,5 mm pri 8 korakih, večja pri 5 korakih ali manj: 71, 81, 98,5 mm pri 5, 4, 3 ali manj; pravilo `layout()` v `tools/build.py`) in okvir (84 × 18 mm) z napisom in poljem za uro (`__ : __`), ob tem krog 35 mm za magnetek tik ob sliki, da otrok poveže sliko in magnetek. Vse mere so spremenljivke CSS iz velikosti papirja (`--page-w`, `--page-h`, `--img`, `--label` v `tools/build.py`); zdaj A4, kasneje ameriški Letter s spremembo spremenljivk strani. Slika, okvir in krog imajo skupen obris in ozadje; ozadje okvirja je barva pasu slike, ki se preliva v okvir (notranjih 12 % v višini okvirja (sredinska postavitev: po vsej višini, kjer se kartica stika), ločeno za levi in desni rob, brez najtemnejše četrtine pik, pretemna se posvetli v pastelno), ki jo izmeri generator.
- Slike se izmenjujejo levo in desno; prva slika se začne na zgornjem robu, zadnja se konča 1,5 mm nad nogo, središča so vmes enakomerno razmaknjena (brez praznega pasu). Naslov je v zgornji vrsti desno od slike 1, poravnan desno, od 3 mm desno od slike 1 do desnega roba (`title_space()` v `tools/build.py`); če ne bi bil vsaj 3 mm od kroga za magnetek koraka 1 (vrh kroga = slika/2 - 17,5 mm; 6 do 8 korakov), se pas začne 3 mm desno od tega kroga. Pisava 21 pt, pri dolgem naslovu manjša, da stane v pas (`title_size()`), a nikoli pod 12 pt: daljši naslov se prelomi, ne prestopi. Velikost je večja od obeh načinov, zaokrožena navzdol na 0,5 mm, 3 mm razmika med predmeti. Ozki okvirji (6 do 8 korakov): slike na isti strani ohranijo razmik, slika + okvir + slika = 200 mm. Široki okvirji (`.rt-wide`, 5 korakov ali manj): okvir teče od svoje slike do skrajnega roba lista prek nasprotnega stolpca, zato mora naslednja slika odmakniti (razdalja središč vsaj slika/2 + 9 mm + razmik), slika, širša od 81 mm, pa mora odmakniti tudi krog soseda; največ 98,5 mm, da stolpca ohranita razmik. Značke s številkami (10 mm) so koncentrične s kotom slike (polmer 7 mm = polmer značke + 1 mm razmika + obroba), po pravilu za gnezdene kote. Pri ozkih okvirjih je omejitev širina: slika + okvir + slika = 200 mm (A4 brez 5 mm stranskih robov); vsak mm slike vzame 2 mm okvirju in napisu, ker okvir seže v višino nasprotne slike.
- Dve postavitvi sličic, polje `layout` lista in *Postavitev sličic* v izdelovalniku. Privzeta, sredina: sličice se stikajo na sredini (3 mm narazen), še vedno izmenično, zato pogled skoči za eno sličico, ne čez širino lista; kartica koraka (visoka kot sličica) se sličice dotika brez prekrivanja (kartica ima pravo CSS obrobo, ki se v pomanjšanem predogledu zaokroži enako; sličica je nima, njen rob na treh straneh je prekrivna plast `::after`, ker obrezovalni okvir z neenakimi robovi sličico na pravi grafični kartici naredi zrnato; obe mečeta enako senco `box-shadow`, brez filtra, ki bi sličico rastriral). Ostrino sličic preverjaj z rastrizacijo na grafični kartici (`--use-angle=gl-egl --ignore-gpu-blocklist --enable-gpu-rasterization`): programsko izrisovanje take razlike skrije in teče navzven do roba lista; krog za magnet je 2 mm nad dnom kartice, napis in ura sta sidrana s spodnjim robom 1,5 mm nad njim, na vseh karticah enako; sličica 1 se začne na zgornjem robu, naslov stoji v desni polovici nad korakom 2, 21 pt v največ dveh vrsticah, prelomljen pri presledkih, manjši šele, če to ne zadošča (`center_title_size()`); sličice največ 58 mm, sličice na isti strani ohranijo 3 mm (55,5 mm pri 8 korakih). Napisi se prelamljajo pri presledkih; ena velikost na list, največja (9 do 20 pt), pri kateri se vsak napis prilega kartici, z uro ali brez (`center_label_size()`, širine znakov izmerjene v `LABEL_EM`). `"sides"`: sličice ob robovih lista, kot je opisano zgoraj. Obe živita v `layout()` s `center` in v CSS `.rt-center`.
- Noga 16 mm nad spodnjim robom nosi znak 0–3 z opozorili, naslov, kontaktni mail (`routines@twotech.si`), licenco (CC0) in 15 mm QR kodo (`children/qr.svg`, naredi jo `tools/qr.py`; znova le ob spremembi naslova); znak 0–3 je enako velik kot QR koda.
- Robovi 5 mm zgoraj in ob straneh, 14 mm spodaj: veliko domačih tiskalnikov spodnjega roba ne natisne. Starejši in profesionalni Epsoni potrebujejo 14 mm za posamezne liste (priročnik Epson SureColor), HP DeskJet okoli 12,7 mm (HP Community, DeskJet 2700); novejši Epsoni zmorejo 3 mm. Nogo (QR kodo) drži nad 14 mm.
- `sheetHtml()` v `children/app.js` zrcali `sheet_html()` v `tools/build.py`: spreminjaj ju skupaj. `children/data.js` je zgrajen; nikoli ga ne urejaj.
- V izdelovalniku listov je vsako zaključeno dejanje en vnos v zgodovini zavihka (`save()`), tipkanje v enem polju ali puščice v enem seznamu en vnos do premora 1 s ali zapustitve polja; Nazaj in Naprej razveljavita in ponovita. `history.back()` v testu ne pritisne gumba Nazaj brskalnika: tega preizkusi v Chromu z oknom na navideznem zaslonu (`env -u WAYLAND_DISPLAY xvfb-run`, `--ozone-platform=x11`, sicer se okno odpre na uporabnikovem zaslonu), tipke prek XTest. Razveljavi je `history.back()`: ne hrani kopije lista, naslov pa nosi le prikazani list, nikoli zastavice Razveljavi ali prejšnjega lista, ker je naslov povezava za deljenje.
- V postavitvi levo-desno se napisi ne prelamljajo. 13 pt krepko z velikimi črkami sprejme okoli 17 znakov (`POSPRAVI POSTELJO`, 44,2 od 45,0 mm). Po spremembi napisov v brezglavem Chromu izmeri, da `scrollWidth` vsakega napisa ne preseže širine okvirja brez kroga za magnetek, robov in razmika (starš `.rt-text` se širi z napisom, zato ni merilo; pravilno to dela `labelRoom()` v `children/app.js`).
- Barva napisa se samodejno potemni do kontrasta vsaj 4,5 : 1 z okvirjem (WCAG 2.2, 1.4.3).
- 6 do 7 korakov na list (največ 8). Dolge rutine razdeli na več listov, namesto da bi manjšal slike.

## Slike

- Upoštevaj `docs/PROMPTS.md`: en akvarelni slog, resnični prostori, brez oblakov (razen ponoči), brez napisov, znamk, zastav ali znanih likov. Ustvarjaj; nikoli ne sestavljaj slike iz prilepljenih delov s kodo.
- Modeli za slike pogosto dajo blede slike. Kontrast povečaj enkrat s Pillow: `ImageOps.autocontrast(cutoff=(0.5, 0.3))`, `ImageEnhance.Contrast(1.1)`, `ImageEnhance.Color(1.12)`, `UnsharpMask(radius=2, percent=50, threshold=3)`. Obrezuj v datoteki, ne s CSS, da se barva roba izmeri na vidnem robu.
- Poziv in zgledne slike prepiši v `.json` slike natanko tako, kot sta šla modelu (iz klica orodja), nikoli obnovljena iz `docs/PROMPTS.md`. Kar ni znano, ostane `unknown`.
- Pred dodajanjem vsake slike upoštevaj veščino `.agents/skills/copyright-check/` na surovi in končni datoteki ter izid zapiši v njen `.json`.

## Pravila

- Repozitorij je samozadosten: vse, kar agent potrebuje (pravila, veščine, orodja), je v njem, in nič se ne sklicuje na datoteke zunaj njega. `CLAUDE.md` in `GEMINI.md` le uvozita to datoteko (angleško različico).
- Začasne datoteke (meritve, profili brskalnika, okolja Python, posnetki), tudi iz orodij, nastajajo v `.private/tmp/<seja>/` v repozitoriju (lastna podmapa, ker vzporedne seje pospravljajo za sabo; git jih prezre), ne v `/tmp` ali drugih sistemskih mapah; po delu jih agent pobriše.
- Nikoli ne oslabi vrat za avtorske pravice (`.github/workflows/copyright-gate.yml`): ostati morajo na `pull_request_target`, ne smejo prevzeti ali pognati kode iz zahteve in morajo ob napaki zavrniti.
- Ko starš sestavlja rutino za svojega otroka, otrokovega imena in drugih osebnih podatkov ne daj v commit ali zahtevo za združitev.
- Primera (`routines/sl/primer.json`, `routines/en/example.json`; izdelovalnik ju naloži) kažeta dobre navade, npr. zaslon vsaj uro pred spanjem (KidsHealth), umite roke pred obrokom, zobje po zadnjem obroku; večer vključuje zdravila in nego, v podporo družinam, ki jih potrebujejo. Slovensko jutro nima zajtrka, ker ga dajo slovenski vrtci; angleško ga ohrani.
- `README`, `CONTRIBUTING` in `AGENTS` drži usklajene v angleščini in slovenščini (`*.sl.md`). `README` je za starše, brez ukazov; gradnja, agenti in prispevki so v `CONTRIBUTING`.
- Razprava strokovnjakov o rutinah ali listih povabi vsaj vzgojitelja Montessori, strokovnjaka za razvoj otrok in strokovnjaka za varnost in označevanje izdelkov za otroke (npr. opozorilni znaki igrač), poleg starša in investitorja; razprava o besedilih za starše povabi še strokovnjaka za prodajo (prodajno besedilo).
- Besedila za starše učinek brez prebranega vira zapišejo kot možnost (»lahko«), nikoli kot dejstvo. Točka, ki jo je vzdrževalec dodal iz prakse (npr. znano zaporedje lahko otroka pomiri, iz otroških knjig o čuječnosti), ostane v taki obliki; pregledi take točke omilijo, ne črtajo.
- Barve so otroške in spolno nevtralne: rumena, oranžna, rdeča, zelena, turkizna in modra kot v igralnici, brez roza in vijoličaste, na listih in v izdelovalniku. Barve korakov ohranijo belo številko pri kontrastu vsaj 3 : 1.
- Magnetki: priporoči 35 mm ali več, vdelane v plastiko; ameriški valj za majhne dele meri 31,7 mm (CPSC 16 CFR 1501). Več pogoltnjenih magnetov se privlači skozi črevesje.
