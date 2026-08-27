<a id="readme-top"></a>

[![Issues][issues-shield]][issues-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![License: TBD][license-shield]][license-url]

<br />
<div align="center">
  <h3 align="center">qor-admin</h3>

  <p align="center">
    QOR's admin panel — Super Admin moderation, Venue/Promoter self-service, and publishing-plan management.
    <br />
    <a href="https://github.com/derlandyb/QOR/tree/main/.specs"><strong>Explore the specs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/derlandyb/QOR">Root QOR repo</a>
    &middot;
    <a href="https://github.com/derlandyb/qor-admin/issues/new?labels=bug">Report Bug</a>
    &middot;
    <a href="https://github.com/derlandyb/qor-admin/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a>
      <ul><li><a href="#built-with">Built With</a></li></ul>
    </li>
    <li><a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

<!-- [product-screenshot]: no screenshot yet — no application code exists in this repo yet, this is scaffolding only -->

`qor-admin` is the Next.js admin panel for **QOR**. Three roles share this app under one Sanctum admin guard (a separate credential space from the fan-facing apps):

* **Super Admin** — approves/rejects Venue and Promoter accounts, approves/rejects events before they go live, manages publishing plans and pricing
* **Venue Admin** — self-registers, creates/submits events tied to their registered venue
* **Promoter** — self-registers, creates/submits events with their own location per event

Unlike the rest of QOR (which follows the NIGHTLIFE-GV design system), `qor-admin` uses its **own** design system — fully adopted from the BootstrapDash "Corona React" admin theme, documented in the root repo's `design-system-admin.md`. This is a deliberate, confirmed decision: the admin panel is an internal operations tool, not part of the fan-facing brand.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![Next.js][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![TypeScript][TypeScript.com]][TypeScript-url]
* [![Tailwind CSS][Tailwind.com]][Tailwind-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

**No application code exists in this repo yet** — this README documents the intended setup once scaffolding lands (see [Roadmap](#roadmap)), it does not describe a working app today.

### Prerequisites

* Node.js
* npm
* Docker + Docker Compose (this repo is one of the four Dockerized services in the root Makefile's stack)

### Installation

Once scaffolded, this repo is intended to be driven entirely from the root `QOR` repo's Makefile — `docker compose` is never invoked directly per-service:

```sh
git clone https://github.com/derlandyb/QOR.git
cd QOR
make up
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

This repo is implemented task-by-task from the root `QOR` repo's spec-driven plan. See [`.specs/tasks/admin.md`](https://github.com/derlandyb/QOR/blob/main/.specs/tasks/admin.md) for the full granular task breakdown, and [`design-system-admin.md`](https://github.com/derlandyb/QOR/blob/main/design-system-admin.md) for this repo's own (Corona-based) design tokens and component catalog.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

- [ ] **MVP Core** — repo/CI scaffolding, Corona design-system component library, account/event approval queues, Venue/Promoter self-registration
- [ ] *(Social & Notifications has no admin UI — favorites/friends/notification preferences are fan-facing only)*
- [ ] **Monetization** — Super Admin plan CRUD, organizer plan/usage view, quota-block upgrade prompt

See the [open issues](https://github.com/derlandyb/qor-admin/issues) for a full list of proposed features (and known issues), and the root repo's `.specs/project/ROADMAP.md` for milestone status.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions make the open source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion, please fork the repo and create a pull request. You can also simply open an issue. Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

No license has been chosen yet for this project. All rights reserved until a license is added.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Derlandy Belchior - derlandy.belchior@gmail.com

Project Link: [https://github.com/derlandyb/qor-admin](https://github.com/derlandyb/qor-admin)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)
* [BootstrapDash Corona React](https://demo.bootstrapdash.com/corona-react/modern-vertical/dashboard) — layout/interaction/animation reference this repo's design system was extracted from

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[issues-shield]: https://img.shields.io/github/issues/derlandyb/qor-admin.svg?style=for-the-badge
[issues-url]: https://github.com/derlandyb/qor-admin/issues
[forks-shield]: https://img.shields.io/github/forks/derlandyb/qor-admin.svg?style=for-the-badge
[forks-url]: https://github.com/derlandyb/qor-admin/network/members
[stars-shield]: https://img.shields.io/github/stars/derlandyb/qor-admin.svg?style=for-the-badge
[stars-url]: https://github.com/derlandyb/qor-admin/stargazers
[license-shield]: https://img.shields.io/badge/license-TBD-lightgrey.svg?style=for-the-badge
[license-url]: #license
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org
[TypeScript.com]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org
[Tailwind.com]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com
