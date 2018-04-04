# Ui-Elf

Copyright (C) 2017 The Open Library Foundation

This software is distributed under the terms of the Apache License,
Version 2.0. See the file "[LICENSE](LICENSE)" for more information.

## Introduction

Ui-Elf is the user interface for mod-elf. Mod-Elf is an Okapi module that provides the webservices for an electronic loanable form, abbreviated ELF.

## Configure Ui-Elf

### Favicon

The default favicon can be replaced with an alternative `16 x 16` favicon. 

1. Move the favicon to your desktop and name it `favicon.png`.
1. Replace the default ELF favicon with your favicon.
    ```bash
    mv ~/Desktop/favicon.png ~/Desktop/folio/ui/ui-elf/src/main/resources/static/favicon.png
    ```

### FOLIO Settings

ELF requires some FOLIO specific information in order to be able to interact with FOLIO web services.

1. Open settings.js
    ```bash
    code ~/Desktop/folio/ui/ui-elf/src/main/resources/static/assets/js/settings.js
    ```
1. Enter your FOLIO specific information.
    ```javascript
    // FOLIO settings
    const USERNAME = 'diku_admin';
    const PASSWORD = 'admin';
    const TENANT = 'diku';
    const HOST = 'http://localhost:9130';
    ```

### Customizing Technology Loan Agreement

The `settings.js` file also allows the user to customize the technology loan agreement.

1. Open settings.js
    ```bash
    code ~/Desktop/folio/ui/ui-elf/src/main/resources/static/assets/js/settings.js
    ```
1. Change the library specific information under the `agreement settings` section.
    ```javascript
    // agreement settings
    const PENALTY = "12,25 €/day";
    const FILE_DURATION = "6 months";
    const LEGAL_NOTICE = "<p>Notice: <i>Warning of Copyright Restrictions. The copyright law of the United States (title 17, United States Code) governs the reproduction, distribution, adaptation, public performance, and public display of copyrighted material. A person who uses technology to make an unauthorized copy of copyrighted material may be liable for copyright infringement unless they have a valid justification for making the copy, such as fair use.</i></p>";
    const RETURN_LOCATION = "Datalogisk Institut Loanable Technology Desk";
    ```

## Install Ui-Elf

```bash
mvn clean install
```

## Deploy Ui-Elf

1. Ensure that Okapi and all relevant modules have been started. See `mod-elf`'s `README.md` before proceeding to the next step.
1. Run the executable jar file.
    ```bash
    java -jar ~/Desktop/folio/ui/ui-elf/target/folio-elf-vertx-fat.jar
    ```
1. Visit <http://localhost:8080/static/index.html> in a web browser.
1. Click `Checkout`.
1. User `339583595735124` should return `Botsford, Larue`.
1. Item `765475420716` should return `Asus Tablet`.

## Static Server Note

Ui-Elf is a purely static website. All of the files necessary to run Ui-Elf can be found in the `static` directory:

```bash
cd ~/Desktop/folio/ui/ui-elf/src/main/resources/static
ls -l
```

For convenience, the static files are bundled into a lightweight Vert.x server (i.e. `folio-elf-vertx-fat.jar`); however, the files can be served using any other static webserver as well (e.g. nginx, apache, etc.).

## Security Note

Since Ui-Elf depends on FOLIO credentials being entered into `settings.js`, Ui-Elf will need to be secured behind a different authentication system. For example, a single sign-on solution, such as `shibboleth`, would work well.
