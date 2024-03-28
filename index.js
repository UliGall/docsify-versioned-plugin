function getVersionPath(path, versions, defaultVersion) {
    /**
     * If the path is /, /README.md or /index.html, we want to redirect to the default version.
     * Otherwise, we want to redirect to the versioned path.
     */
    const parts = path.split('/');
    const version = versions.find((v) => v.folder === parts[1]);
    return version ? version.folder : defaultVersion;
}

function versionedDocsPlugin(hook, vm) {
    var versions = vm.config.versions || [];
    var defaultVersion = vm.config.versions.find((v) => v.default).folder;

    function updateVersion(version) {
        var newPath = vm.route.path.split('/').slice(1).join('/');
        var query = new URLSearchParams(vm.route.query).toString();
        window.location.href = `/${version}/#/${newPath}?${query}`;
    };

    function initVersionSelector() {
        // Version selector
        var selector = document.createElement('div');
        selector.className = 'version-selector';
        selector.innerHTML = `
        <select>
            ${versions
                .map(
                    (v) =>
                        `<option value="${v.folder}" ${v.default ? 'selected' : ''
                        }>${v.label}</option>`
                )
                .join('')}
        </select>
        `;

        // Adding event listener
        var versionPath = (window.location.pathname && window.location.pathname.split('/')[1]) || defaultVersion;
        selector.querySelector('select').value = versionPath;
        selector.querySelector('select').addEventListener('change', function () {
            updateVersion(this.value);
        });

        // Adding label
        var labelText = vm.config.versionSelectorLabel || 'Version:';
        var label = document.createElement('span');
        label.className = 'version-selector-label';
        label.textContent = labelText;
        selector.insertBefore(label, selector.querySelector('select'));

        var nameEl = document.querySelector('.app-name');
        if (nameEl) {
            var versionLabel = versions.find((v) => v.folder === versionPath).label;
            nameEl.innerHTML += ` <small>${versionLabel}</small>`;
            nameEl.parentNode.insertBefore(selector, nameEl.nextElementSibling);
        }
        return selector;
    }

    hook.ready(function () {
        // Set coverpage to false if it's not a versioned coverpage
        if (vm.route.path !== '/_coverpage.md') {
            vm.config.coverpage = false;
        }

        // Initialize the version selector
        versionSelector = initVersionSelector();
    });

    hook.beforeEach(function (html, next) {
        // Replace {{versionLabel}} with the current version label in all markdown files
        var versionPath = getVersionPath(vm.compiler.contentBase, versions, defaultVersion);
        var version = versions.find((v) => v.folder === versionPath);

        if (version) {
            var versionLabel = version.label;
            var updatedHtml = html.replace(/{{versionLabel}}/g, versionLabel);
            next(updatedHtml);
        } else {
            next(html);
        }
    });

    hook.doneEach(function () {
        // Replace {{versionLabel}} with the current version label in coverpage
        var versionPath = getVersionPath(vm.compiler.contentBase, versions, defaultVersion);
        var version = versions.find((v) => v.folder === versionPath);

        if (version) {
            var versionLabel = version.label;
            var cover = document.querySelector('.cover');
            if (cover) {
                cover.innerHTML = cover.innerHTML.replace(/{{versionLabel}}/g, versionLabel);
            }
        }
    });
}

window.$docsify.plugins = [].concat(versionedDocsPlugin, window.$docsify.plugins);

(function () {
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        var defaultVersion = window.$docsify.versions.find((v) => v.default).folder;
        window.location.replace('/' + defaultVersion + '/');
    }
})();
