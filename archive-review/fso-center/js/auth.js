// ================================================================
//  AUTH.JS — Аутентификация и управление ролями
// ================================================================

const Auth = {
    _currentUser: null,
    _isAdmin: false,

    init() {
        try {
            const session = JSON.parse(localStorage.getItem('fso_session') || 'null');
            if (session) {
                this._currentUser = session.user;
                this._isAdmin = session.isAdmin;
            }
        } catch (e) {
            localStorage.removeItem('fso_session');
        }
    },

    loginAsAdmin(password) {
        const settings = Store.getSettings();
        if (password === settings.adminPassword) {
            this._currentUser = {
                id: 'admin',
                name: 'Администратор',
                rank: 'Администратор системы',
                role: 'admin'
            };
            this._isAdmin = true;
            this._saveSession();
            return true;
        }
        return false;
    },

    loginAsCadet(password) {
        const cadet = Store.findCadetByPassword(password);
        if (cadet) {
            this._currentUser = {
                id: cadet.id,
                name: cadet.fullName,
                rank: cadet.rank,
                department: cadet.department,
                role: 'cadet'
            };
            this._isAdmin = false;
            this._saveSession();
            return cadet;
        }
        return null;
    },

    logout() {
        this._currentUser = null;
        this._isAdmin = false;
        localStorage.removeItem('fso_session');
    },

    isAdmin() {
        return this._isAdmin;
    },

    isCadet() {
        return this._currentUser && this._currentUser.role === 'cadet';
    },

    isGuest() {
        return !this._currentUser;
    },

    getCurrentUser() {
        return this._currentUser;
    },

    changeAdminPassword(oldPass, newPass) {
        const settings = Store.getSettings();
        if (settings.adminPassword === oldPass) {
            settings.adminPassword = newPass;
            localStorage.setItem(Store.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            Store._data.settings = settings;
            return true;
        }
        return false;
    },

    _saveSession() {
        localStorage.setItem('fso_session', JSON.stringify({
            user: this._currentUser,
            isAdmin: this._isAdmin
        }));
    }
};