/**
 * @version 0.43
 * https://reactnavigation.org/docs/navigating-without-navigation-prop
 * https://reactnavigation.org/docs/navigation-prop/
 */
import config from '@app/config/config'

import { navigate, reset, goBack, currentRoute, canGoBack } from '@app/components/navigation/NavRoot'

export default {

    reset(routeName, params = {}) {
        if (routeName === 'HomeScreen' || routeName === 'HomeScreenPop') {
            try {
                let i = 0
                let doBack = false
                do {
                    i++
                    const current = currentRoute()
                    if (current.name !== 'HomeScreen' && current.name !== 'HomeScreenPop') {
                        if (canGoBack()) {
                            goBack()
                            doBack = true
                        }
                    } else {
                        doBack = true
                        break
                    }
                } while (i < 10)
                if (i< 10 && doBack) return true
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('NavStore.reset error ' + e.message)
                }
            }
        }

        try {
            reset({
                index: 0,
                routes: [{ name: routeName, params }],
            }, params)
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NavStore.reset error ' + e.message)
            }
        }
    },

    goBack() {
        try {
           if (canGoBack()) {
                goBack()
           }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NavStore.goBack error ' + e.message)
            }
        }
    },

    goNext(routeName, params = null, reset = false) {
        if (reset) {
            console.log('navstore reset is depressed')
            this.reset(routeName)
            return false
        }

        try {
            navigate(routeName, params)
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NavStore.goNext error ' + e.message)
            }
        }
    },

    getParamWrapper(screen, data, def = false) {
        try {
            if (typeof screen.props.route === 'undefined' || typeof screen.props.route.params === 'undefined' || !screen.props.route.params || typeof screen.props.route.params[data] === 'undefined') {
                return def
            }
            return screen.props.route.params[data]
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NavStore.getParamWrapper error ' + e.message)
            }
            return def
        }
    }
}
