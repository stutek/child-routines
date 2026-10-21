# Navodila za agente

[English](AGENTS.md) · **Slovenščina**

Listi A4 za tisk z rutino majhnega otroka (jutro, večerja, spanje). Visijo na hladilniku; otrok sledi sličicam in na krog opravljenega koraka položi magnetek, odrasli preberejo vrstni red in predvideno uro. Javni repozitorij: brez imen in fotografij resničnih oseb.

## Datoteke

| Pot                               | Vsebina                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `routines/<jezik>/<ime>.json`     | Rutina: listi, vsak z naslovom, nebom in koraki (napis, oznaka slike, barva). |
| `images/<oznaka>.jpg` + `.json`   | Slika 1024 × 1024 in njeni metapodatki (model, poziv, urejanje, preverba).    |
| `output/<jezik>-<ime>.html`       | Zgrajeni listi za tisk. Nikoli jih ne urejaj ročno.                           |
| `tools/build.py`                  | Generator: rutine → output.                                                   |
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
```

Spremembo preveri vizualno: datoteko iz `output/` z brezglavim Chromom natisni v PDF in jo poglej (`google-chrome --headless=new --print-to-pdf=out.pdf file://$PWD/output/<datoteka>.html`).

## Postavitev in njene meje

- Korak je en predmet: kvadratna slika (54 mm) in okvir (92 × 18 mm) z napisom in poljem za uro (`__ : __`), ob tem krog 35 mm za magnetek. Slika, okvir in krog imajo skupen obris in ozadje; ozadje okvirja je barva roba slike (svetlejša polovica pasu ob robu, pretemna se posvetli v pastelno), ki jo izmeri generator.
- Slike se izmenjujejo levo in desno. Omejitev je širina: slika + okvir + slika = 200 mm (A4 brez 5 mm stranskih robov), ker okvir seže v višino nasprotne slike.
- Robovi 5 mm zgoraj in ob straneh, 14 mm spodaj: domači tiskalniki spodnjih 13 do 14 mm ne natisnejo (specifikacija Epson: 3 mm zgoraj in ob straneh, 14 mm spodaj).
- Napisi se ne prelamljajo. 14 pt krepko z velikimi črkami sprejme okoli 17 znakov (`POSPRAVI POSTELJO`). Po spremembi napisov v brezglavem Chromu izmeri, da je `scrollWidth` vsakega napisa manjši od širine starša.
- Barva napisa se samodejno potemni do kontrasta vsaj 4,5 : 1 z okvirjem (WCAG 2.2, 1.4.3).
- 6 do 7 korakov na list (največ 8). Dolge rutine razdeli na več listov, namesto da bi manjšal slike.

## Slike

- Upoštevaj `docs/PROMPTS.md`: en akvarelni slog, resnični prostori, brez oblakov (razen ponoči), brez napisov, znamk, zastav ali znanih likov. Ustvarjaj; nikoli ne sestavljaj slike iz prilepljenih delov s kodo.
- Modeli za slike pogosto dajo blede slike. Kontrast povečaj enkrat s Pillow: `ImageOps.autocontrast(cutoff=(0.5, 0.3))`, `ImageEnhance.Contrast(1.1)`, `ImageEnhance.Color(1.12)`, `UnsharpMask(radius=2, percent=50, threshold=3)`. Obrezuj v datoteki, ne s CSS, da se barva roba izmeri na vidnem robu.
- Pred dodajanjem vsake slike upoštevaj veščino `.agents/skills/copyright-check/` na surovi in končni datoteki ter izid zapiši v njen `.json`.

## Pravila

- Repozitorij je samozadosten: vse, kar agent potrebuje (pravila, veščine, orodja), je v njem, in nič se ne sklicuje na datoteke zunaj njega. `CLAUDE.md` in `GEMINI.md` le uvozita to datoteko (angleško različico).
- Nikoli ne oslabi vrat za avtorske pravice (`.github/workflows/copyright-gate.yml`): ostati morajo na `pull_request_target`, ne smejo prevzeti ali pognati kode iz zahteve in morajo ob napaki zavrniti.
- Ko starš sestavlja rutino za svojega otroka, otrokovega imena in drugih osebnih podatkov ne daj v commit ali zahtevo za združitev.
- `README`, `CONTRIBUTING` in `AGENTS` drži usklajene v angleščini in slovenščini (`*.sl.md`).
- Magnetki: priporoči 35 mm ali več, vdelane v plastiko; ameriški valj za majhne dele meri 31,7 mm (CPSC 16 CFR 1501). Več pogoltnjenih magnetov se privlači skozi črevesje.
