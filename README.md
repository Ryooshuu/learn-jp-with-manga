<div align="center">
<h1>Learn JP with Manga</h1>

*Learning Japanese through reading manga!*

<h6> (A better name will be given soon)</h6>
<br>

[![license](https://img.shields.io/gitlab/license/ryooshuu/learn-jp-with-manga)](https:)
[![discord server](https://discord.com/api/guilds/1089516715613892638/widget.png?style=shield)](https://discord.gg/Qe6DtngFbR)
</div>

---

## Table of contents:
- [Requirements](#requirements)
- [Setup](#setup)
- - [Manual setup](#manual-setup)
- - [Using Docker](#using-docker)
- [Contributing](#contributing)
- [License](#license)

---

## Requirements
- PostgreSQL v15.0+

## Setup
If you wish to help development (please see [contributing](#contributing)) or wish to launch an instance of your own, you have two of the following options:

### Manual setup
To set up this repository you will need to following prerequisites:
- PostgreSQL v15.0+
- Node.js 16

Once installed, and once you've cloned the repository, you may install all the necessary packages used in this project using the following command: `npm i --include=dev`. Before running the server however you need to do some configuring. Use the following command to copy the example environment configuration:

```sh
# copy the example file and edit the settings, the important one is DATABASE_URL.
# however, if you used the docker-compose in the root directory, you are not required to change it.
$ cp .env.example .env
$ vi .env
```

After configuring, you can run the webserver by running `./run.sh`. This will start both the API server and the webserver simultaniously. If you wish to run both servers in a separate CLI, you may use the command `npm run dev` in each respective root directory.

### Using Docker
todo

## Contributing
We welcome all contributions, but keep in mind that we already have the full site [designed](#) (mock-ups). If you wish to work on a new section, please open an issue and we will give you what you need from a design perspective to proceed. if you want to make *changes* to the design, we recommend you open an issue with your intentions before spending too much time, to ensure no effort is wasted.

If you're unsure of what you can help with, check out the list of open issues on either our [github page](https://github.com/Ryooshuu/learn-jp-with-manga/issues), or our [gitlab page](https://gitlab.com/ryooshuu/prisma-generator-model/-/issues). (especially those with the "good first issue" label).

Please see [contributing.md](#) for information about the code standards we expect from pull requests. While we have standards in place, nothing is set in stone. If you have an issue with the way code is structured; with any libraries we are using; with any processes involved with contributing, *please* bring it up. We welcome all feedback so we can make contributing to this project as pain-free as possible.

## License
Learn-JP-With-Manga is licensed under the [MIT](https://opensource.org/licenses/MIT) License. For more information, refer to the [license file](https://gitlab.com/ryooshuu/learn-jp-with-manga/-/blob/master/LICENSE) regarding what is permitted or disallowed in the codebase of this repository.