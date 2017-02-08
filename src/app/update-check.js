import when from 'when';
import chalk from 'chalk';

function spin() {
	return require('./ui').spin;
}

import info from '../../package';
import settings from '../../settings';

function semver() {
	return require('semver');
}

function check(skip) {
	return when.promise((resolve) => {
		if (skip) {
			return resolve();
		}

		const now = Date.now();
		const lastCheck = settings.profile_json.last_version_check || 0;
		if (now - lastCheck >= settings.updateCheckInterval) {
			settings.profile_json.last_version_check = now;
			checkVersion().then(() => {
				settings.saveProfileData();
				start();
				resolve();
			});
			return;
		}

		start();
		resolve();
	});
}

function checkVersion() {
	const latestVersion = require('latest-version');
	const checkPromise = when(latestVersion(info.name)).timeout(settings.updateCheckTimeout);

	return spin()(checkPromise, 'Checking for updates...')
		.then((version) => {
			if (semver().gt(version, info.version)) {
				settings.profile_json.newer_version = version;
			} else {
				delete settings.profile_json.newer_version;
			}
		})
		.catch(() => {});
}

function displayVersionBanner(version) {
	console.error('particle-cli v' + info.version);
	console.error();
	console.error(chalk.yellow('!'), 'A newer version (' + chalk.cyan(version) + ') of', chalk.bold.white('particle-cli'), 'is available.');
	console.error(chalk.yellow('!'), 'Upgrade now by running:', chalk.bold.white('npm install -g particle-cli'));
	console.error();
}

function start() {
	const storedVersion = settings.profile_json.newer_version;
	if (storedVersion && semver().gt(storedVersion, info.version)) {
		displayVersionBanner(storedVersion);
	}
}

export default check;
