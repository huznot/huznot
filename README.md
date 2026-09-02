<div align="center">

<img src="./assets/header.svg" width="900" alt="muhammad irfan, environmental data, applied ml, game dev">

<table>
<tr>
<td valign="top"><img src="./assets/card.svg" width="440" alt="stack and tooling"></td>
<td valign="top"><img src="./assets/crosswalk.svg" width="440" alt="icd crosswalk f1 results"></td>
</tr>
</table>

</div>

## what i actually do

i build things that measure something real and then check whether the measurement holds up.

that mostly looks like three tracks. environmental and health data, where i pull live government feeds and turn them into risk models that get validated against actual surveillance records. applied ml, where i work on retrieval and mapping problems with medical coding data. and shipping apps, usually mobile or web, that people outside a classroom can open and use.

game dev is the fourth track and it is the one that started all of it. more of those are going up here soon.

## featured · mosi

<div align="center">
<img src="./assets/mosi.svg" width="900" alt="mosi system diagram: twelve government apis feed biological proxy models that output a regional risk score">
</div>

**[mosi · manitoba outdoor safety index](https://github.com/huznot/MOSI)** · [video walkthrough](https://www.youtube.com/shorts/96YkiCytAJQ)

an app that models vector borne infection and outdoor environmental risk across manitoba communities. it pulls live data from twelve government apis and turns it into a single regional risk score using biological proxy models i built myself.

the part i care about most is the validation folder. it parses official manitoba weekly west nile surveillance data, lines it up with archived daily weather, and reruns the app's own scoring equations against real outbreak history. a risk model nobody checked against reality is just a colour gradient.

- live regional scoring for weather, air quality, wildfire, water, vector borne disease, and health advisories
- beach water quality monitoring for e. coli and algal blooms
- boreal vector modelling for west nile, jamestown canyon, and snowshoe hare virus
- real time manitoba emergency alerts and hydro outage tracking
- 7 day forecasting compared against a baseline

built with mentorship from dr. michael drebot, former director of zoonotic diseases at canada's national microbiology lab. won a manitoba schools science symposium silver medal and the canadian meteorological and oceanographic society excellence in environmental science award.

## selected work

| project | what it is | why it was hard |
| --- | --- | --- |
| [cleanit](https://github.com/huznot/CleanIt) | trash for cash. point your camera at an item, get told what it is and where it goes, drop it off, earn points that turn into rewards from winnipeg businesses. | making recycling worth doing. 160+ mapped locations, real depot hours, and an incentive loop that survives contact with people who do not care about recycling. |
| [icd crosswalk automation](https://github.com/huznot/SAPBert) | maps decades of legacy medical diagnosis codes to modern ones automatically, work that is normally done by hand by clinical coders over months. | pushed f1 from .423 to .524 on icd-9-cm to icd-10-ca and .716 to .761 going backwards to icda-8, then wrote up where the correct mappings still get lost. |
| [noteify](https://github.com/huznot/Noteify) | a note sharing platform. browse, upload, like, and search notes from a grid feed. | plain html, css, and js on php and mysql with no framework, on purpose, so i understood every line of it. |
| [gamenet](https://github.com/huznot/gamenet-main) · [live](https://gamenet-zeta.vercel.app) | a home for the browser games i had been writing one at a time. 2048, flappy bird, pong, tic tac toe, stick game, no ads. | it is the project that made me realise i liked building the shell around the games as much as the games. |
| [expresso](https://github.com/huznot/expresso-2) · [live](https://expreso-self.vercel.app) | typescript web app, deployed. | shipping something to a url and keeping it there. |
| [frugal](https://github.com/huznot/frugal-app) | typescript app in progress. | in progress. |

cleanit started at a canu and kahanee design lab, was developed further at shad, has taken more than $3.5k in funding, and has been presented to the mayor of winnipeg. it is built around wahkohtowin, the cree understanding that all living things are related and that relatedness carries responsibility, and it operates on treaty 1 territory.

## the record

- canadian meteorological and oceanographic society, excellence in environmental science award
- manitoba schools science symposium, silver medal
- cybertitan, national finalist
- ingenious+ award
- shad canada · canu and kahanee design lab
- $3.5k+ in project funding, and a pitch to the mayor of winnipeg

## the log

<div align="center">

<img src="./assets/contrib.svg" width="900" alt="contribution log for the last twelve months">

<table>
<tr>
<td valign="top"><img src="./assets/langs.svg" width="440" alt="language distribution across public repositories"></td>
<td valign="top">
<img src="https://github-readme-streak-stats.herokuapp.com/?user=huznot&hide_border=true&background=00000000&stroke=C2D2E0&ring=C0562F&fire=C0562F&currStreakLabel=C0562F&sideLabels=4A6076&currStreakNum=173A5E&sideNums=173A5E&dates=8A99A8&border_radius=4" width="440" alt="streak stats">
<br>
<img src="https://github-profile-trophy.vercel.app/?username=huznot&theme=flat&no-frame=true&no-bg=true&column=3&row=2&margin-w=6&margin-h=6" width="440" alt="github trophies">
</td>
</tr>
</table>

</div>

the contribution plate and the language plate are generated from the github api by [a workflow in this repo](.github/workflows/stats.yml) and committed as svgs, so they render in the same style as everything else here and do not break when someone else's server goes down.

## reach me

[![email](https://img.shields.io/badge/email-huznot%40gmail.com-C0562F?style=for-the-badge&labelColor=173A5E)](mailto:huznot@gmail.com)
[![github](https://img.shields.io/badge/github-huznot-173A5E?style=for-the-badge&labelColor=173A5E)](https://github.com/huznot)
[![linkedin](https://img.shields.io/badge/linkedin-connect-173A5E?style=for-the-badge&labelColor=173A5E)](https://www.linkedin.com/in/YOUR-LINKEDIN-HERE)

<sub>winnipeg, manitoba · treaty 1 territory</sub>
