---
name: copyright-check
description: Preveri, da slika za rutino ni kopija obstoječega dela, preden jo dodaš ali združiš. Za vsako novo ali spremenjeno sliko v images/, za pregled zahteve za združitev s slikami in pred objavo.
---

# Preverba avtorstva slik

[English](SKILL.md) · **Slovenščina**

Slika sme v `images/` le, če na spletu ni njene kopije ali kopije njenega dela. Modeli za slike včasih skoraj natančno ponovijo obstoječ klipart: zobek, ki drži ščetko nad glavo, je bil skoraj enak klipartu na Pngtree (2020) in Pikbest (2019), le prebarvan.

## Kdaj

- Takoj po ustvarjanju, na **surovi** sliki, kot jo vrne model.
- Še enkrat na **končni** datoteki po vsakem urejanju (kontrast, obrez, retuša). Urejanje lahko oslabi zaznavo, zato morata preverbo prestati obe različici.
- Ob vsaki zahtevi za združitev: potek `copyright-gate` končne datoteke preveri samodejno.
- Vsako drugo grafiko, ki jo projekt objavi, npr. `web/icon.svg`, pred prvim commitom: Lens na izrisu 512 px; vrata je ne pokrijejo. Izid zapiši v komentar v datoteki.

## Kako

1. **Samodejno (vrata in lokalno):** `VISION_API_KEY=... python3 tools/copyright_check.py <slike...>`. Google Cloud Vision Web Detection; slika pade ob vsakem zadetku `fullMatchingImages`, `partialMatchingImages` ali `pagesWithMatchingImages` zunaj tega repozitorija. Pade tudi, če ključa ni ali API vrne napako.
2. **Ročna druga preverba (lokalno, neobvezno):** `python3 tools/lens_check.py <absolutna pot>` z razhroščevalnim Chromom (glej glavo skripta). Preberi zavihek *Exact matches*. Lens je prebarvanega zobka našel, zato je odporen na spremembo barv.

## Odločitev

- Vsak natančen ali delni zadetek ali stran, ki sliko prikazuje: **zavrni**. Ustvari novo sliko z drugačno kompozicijo; stare ne urejaj, dokler ne prestane preverbe.
- Le *podobne* slike (isti motiv, druga slika): sprejmi.
- Stran z zadetkom zahteva preverjanje robota ali prijavo: ne obhajaj je; zadetek velja za resničen.
- Ročnih izjem od vrat ni.

## Zapis

Izid zapiši v `.json` slike:

```json
"copyright_check": {"date": "YYYY-MM-DD", "method": "Vision Web Detection (surova in končna); Google Lens Exact matches", "result": "no exact matches"}
```

Ujemanje, ki zahteva natančnejši pregled (podobna postavitev, skoraj kopija, vprašanje licence), dobi svoj zapis v `docs/copyright-investigations/<datum>-<slika>-<vir>.md`: slika s commitom, oznako blob in SHA-256, ujemanje z URL in licenco, primerjava, odločitev in viri.
