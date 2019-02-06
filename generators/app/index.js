const chalk = require('chalk');
const request = require('request');
const fs = require("fs");
const packagejs = require('../../package.json');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');

function create_translate_tab(json, tab) {
    for (var i in json) {
        if (typeof(json[i]) == "string") {
            if (!(i == "created" || i == "updated" || i == "deleted" || i == "question" || i == "createLabel" || i == "createOrEditLabel")) {
                tab.push(json[i]);
            }
        } else {
            create_translate_tab(json[i], tab);
        }
    }
}

global.translation = function(json, tab, entiteSrc, entiteDest) {
    for (var i in json) {
        if (typeof(json[i]) == "string") {
            if (i == "created" || i == "updated" || i == "deleted" || i == "question" || i == "createLabel" || i == "createOrEditLabel") {
                var re = new RegExp(entiteSrc, "gi");
                json[i] = json[i].replace(re, entiteDest)
            } else {
                json[i] = tab.pop();
            }
        } else {
            translation(json[i], tab, entiteSrc, entiteDest);
        }
    }
}

module.exports = class extends BaseGenerator {
    get initializing() {
        return {
            init(args) {
                if (args === 'default') {
                    // do something when argument is 'default'
                }
            },
            readConfig() {
                this.jhipsterAppConfig = this.getJhipsterAppConfig();
                if (!this.jhipsterAppConfig) {
                    this.error('Can\'t read .yo-rc.json');
                }
            },
            displayLogo() {
                // it's here to show that you can use functions from generator-jhipster
                // this function is in: generator-jhipster/generators/generator-base.js
                this.printJHipsterLogo();

                // Have Yeoman greet the user.
                this.log(`\nWelcome to the ${chalk.bold.yellow('JHipster translation')} generator! ${chalk.yellow(`v${packagejs.version}\n`)}`);
            },
            checkJhipster() {
                const currentJhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
                const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
                if (!semver.satisfies(currentJhipsterVersion, minimumJhipsterVersion)) {
                    this.warning(`\nYour generated project used an old JHipster version (${currentJhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`);
                }
            }
        };
    }

    prompting() {
        const prompts = [{
            type: 'input',
            name: 'message',
            message: 'Please enter your Google Translate API KEY : ',
            default: 'This generator works only with a valid Google Translate API KEY'
        }];

        const done = this.async();
        this.prompt(prompts).then((props) => {
            this.props = props;
            // To access props later use this.props.someOption;

            done();
        });
    }

    writing() {
        // function to use directly template
        this.template = function(source, destination) {
            this.fs.copyTpl(
                this.templatePath(source),
                this.destinationPath(destination),
                this
            );
        };

        // read config from .yo-rc.json
        this.baseName = this.jhipsterAppConfig.baseName;
        this.packageName = this.jhipsterAppConfig.packageName;
        this.packageFolder = this.jhipsterAppConfig.packageFolder;
        this.clientFramework = this.jhipsterAppConfig.clientFramework;
        this.clientPackageManager = this.jhipsterAppConfig.clientPackageManager;
        this.buildTool = this.jhipsterAppConfig.buildTool;

        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();

        // use constants from generator-constants.js
        const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;
        global.nativeLanguage = this.jhipsterAppConfig.nativeLanguage;

        // variable from questions
        this.message = this.props.message;

        // show all variables
        this.log('\n--- some config read from config ---');
        this.log(`baseName=${this.baseName}`);
        this.log(`packageName=${this.packageName}`);
        this.log(`clientFramework=${this.clientFramework}`);
        this.log(`clientPackageManager=${this.clientPackageManager}`);
        this.log(`buildTool=${this.buildTool}`);

        this.log('\n--- some function ---');
        this.log(`angularAppName=${this.angularAppName}`);

        this.log('\n--- some const ---');
        this.log(`javaDir=${javaDir}`);
        this.log(`resourceDir=${resourceDir}`);
        this.log(`webappDir=${webappDir}`);

        this.log('\n--- variables from questions ---');
        this.log(`\nAPI key (google translate)=${this.message}`);
        this.log('------\n');

        if (this.clientFramework === 'angular1') {
            this.template('dummy.txt', 'dummy-angular1.txt');
        }
        if (this.clientFramework === 'angularX' || this.clientFramework === 'angular2') {
            var api = this.props.message;
            var googleTranslate = require('google-translate')(api);

            this.template('dummy.txt', 'dummy-angularX.txt');
            var jsonNotEntities = [
                'activate.json',
                'audits.json',
                'configuration.json',
                'error.json',
                'global.json',
                'health.json',
                'home.json',
                'login.json',
                'logs.json',
                'metrics.json',
                'password.json',
                'register.json',
                'reset.json',
                'sessions.json',
                'settings.json',
                'user-management.json'
            ]
            console.log("\n *START* \n");
            var path = `${webappDir}i18n/`;
            var allLangs = fs.readdirSync(path);
            for (var i = 0; i < allLangs.length; i++) {
                if (allLangs[i] != nativeLanguage) {
                    var langPath = `${webappDir}i18n/` + allLangs[i];
                    var lang = allLangs[i];
                    var langFiles = fs.readdirSync(langPath);
                    for (var j = 0; j < langFiles.length; j++) {
                        if (!jsonNotEntities.includes(langFiles[j])) {
                            var content = fs.readFileSync(langPath + '/' + langFiles[j]);
                            var contentParse = JSON.parse(content);
                            var entite = langFiles[j].split('.');
                            var tab = [];
                            tab.push(entite[0]);
                            tab.push(lang);
                            create_translate_tab(contentParse, tab);
                            tab.reverse();
                            googleTranslate.translate(tab, nativeLanguage, lang, function(err, translation) {
                                if (err == null) {
                                    var tab = [];
                                    for (var i = 0; i < translation.length; i++) {
                                        tab.push(translation[i].translatedText);
                                    }
                                    console.log("Translate file (" + nativeLanguage + " --> " + translation[translation.length - 2].originalText + ") : " + `${webappDir}i18n/` + translation[translation.length - 2].originalText + `/` + translation[translation.length - 1].originalText + `.json\n`);

                                    var navbarPath = `${webappDir}i18n/` + translation[translation.length - 2].originalText + `/` + translation[translation.length - 1].originalText + `.json`;
                                    var content = fs.readFileSync(navbarPath);
                                    var contentParse = JSON.parse(content);

                                    var entite = translation[translation.length - 1].originalText;
                                    var entiteTranslated = tab.pop();
                                    tab.pop();
                                    global.translation(contentParse, tab, entite, entiteTranslated);
                                    fs.writeFileSync(navbarPath, JSON.stringify(contentParse, null, 2));
                                } else {
                                    console.log(err.body);
                                }
                            });

                        }
                    }
                }

            }

        }
        if (this.buildTool === 'maven') {
            this.template('dummy.txt', 'dummy-maven.txt');
        }
        if (this.buildTool === 'gradle') {
            this.template('dummy.txt', 'dummy-gradle.txt');
        }
    }

    install() {
        let logMsg =
            `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

        if (this.clientFramework === 'angular1') {
            logMsg =
                `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install & bower install`)}`;
        }
        const injectDependenciesAndConstants = (err) => {
            if (err) {
                this.warning('Install of dependencies failed!');
                this.log(logMsg);
            } else if (this.clientFramework === 'angular1') {
                this.spawnCommand('gulp', ['install']);
            }
        };
        const installConfig = {
            bower: this.clientFramework === 'angular1',
            npm: this.clientPackageManager !== 'yarn',
            yarn: this.clientPackageManager === 'yarn',
            callback: injectDependenciesAndConstants
        };
        if (this.options['skip-install']) {
            this.log(logMsg);
        } else {
            this.installDependencies(installConfig);
        }
    }

    end() {
        this.log('End of translation generator');
    }
};
