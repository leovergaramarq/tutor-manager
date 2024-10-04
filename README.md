# tutor-manager
Tutor.com auto scheduler and facilitator of billing information. This Web Application allows tutors to schedule their Tutor.com working hours in a very short time, before available hours become unavailable.

## Built with:

 - Server side: [Node.js](https://nodejs.org/), [ExpressJS](https://expressjs.com/), [Puppeteer](https://pptr.dev), [SQLite](https://www.sqlite.org).
 - Client side: [Handlebars](https://handlebarsjs.com), CSS and JavaScript (Vanilla).

## Getting Started

### Releases (Windows)

See [Download Releases](https://github.com/leovergaramarq/tutor-manager/releases) for an executable release of the app (make sure to follow the instructions for browser configuration). Unzip the downloaded file and run the `tutor-manager.exe` file. The program might be identified as an unrecognized app by Windows. In that case, just procceed to run it anyways.

### Source Code

You can also get the source code following the next steps:

#### Prerequisites

- [Node.js](https://nodejs.org/) stable version (v18.20.2 or higher).
- NPM stable version.

1. Clone this repo:

       git clone https://github.com/leovergaramarq/tutor-manager.git

2. Open a terminal in the cloned repository folder.

3. Install the required dependencies:

       npm install

4. Start the project:

       npm start

## Usage

### Initial Setup

In the first run, you will be prompted for a port number for the server and puppeteer-executable-path for the web scrapping.

<img src="https://github.com/leovergaramarq/tutor-manager/assets/73978713/a140fc4b-82e8-40aa-acb7-89e3c23a6868" style="text-align: left;">

Once the server is running, open `http://localhost:<port>` in your browser.

### Login

In the Login page, enter your Tutor.com credentials. These credentials are stored in the app's local database. You can also validate them before logging in.

<img src="https://github.com/leovergaramarq/tutor-manager/assets/73978713/b3ca679d-7e75-4161-86ae-f8aca16fdb9b">

Note: When logging out, your credentials are removed from the local database. In that case, the auto-scheduling feature will not apply.

### Scheduling

In the Home page, you will find your calendar. Here you can choose the hours you wish to schedule for working, by clicking or by selecting an area. Make sure to select the hours from the desired week and save the changes.

**Important**: the calendar's Time Zone is the Eastern Time Zone from USA (the same way as the Tutor.com Scheduler).

<img src="https://github.com/leovergaramarq/tutor-manager/assets/73978713/f709508c-6088-4f94-a871-56533da151cf">

You will also find the local and Eastern time, as well as a countdown until the scheduling time deadline.

### Billing

Billing information for the current month. Fields like USD price and Payment per Minute are modifiable.

<img src="https://github.com/leovergaramarq/tutor-manager/assets/73978713/75a5224e-c8ea-4ae4-995b-d66a975436c2">

### Preferences

Customize your preferences. A description of each setting is displayed when hovering the info icon.

**Important**: For user simplicity, the day and hour to schedule setup are relative to your local Time Zone.

<img src="https://github.com/leovergaramarq/tutor-manager/assets/73978713/d9272435-ff7f-4202-accf-69b5176dc1b1">

## Build

To bundle the project and generate an executable, open a terminal in the source code directory. Then, run the next command:

    npm run dist

This process might take up to 2 minutes. It will generate a `dist` folder in the project root directory. There, you will find the executable file, as well as the necesary source code folders.

Also, a `build` folder will be generated, with the source code converted from ES6 to CommonJS by Babel. This folder can be deleted.
