/**
 * @version 0.5
 * https://etherscan.io/apis#accounts
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'

const Web3 = require('web3')

export default class EthBasic {
    /**
     * @type {Web3}
     * @public
     */
    _web3

    /**
     * @type {string}
     * @public
     */
    _web3Link

    /**
     * @type {string}
     * @public
     */
    _etherscanSuffix

    /**
     * @type {string}
     * @public
     */
    _etherscanApiPath

    /**
     * @type {string}
     * @public
     */
    _etherscanApiPathInternal

    /**
     * @type {string}
     * @public
     */
    _trezorServer

    /**
     * @type {string}
     * @public
     */
    _trezorServerCode = 'ETH_TREZOR_SERVER'

    /**
     * @type {string}
     * @public
     */
    _tokenAddress

    /**
     * @type {string}
     * @public
     */
    _delegateAddress


    /**
     * @param {string} settings.network
     * @param {string} settings.currencyCode
     */
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('EthNetworked requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('EthNetworked requires settings.network')
        }
        switch (settings.network) {
            case 'mainnet':
            case 'ropsten':
            case 'rinkeby':
            // case 'kovan' : case 'rinkeby' : case 'goerli' :
                this._web3Link = `https://${settings.network}.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
                break
            default:
                throw new Error('while retrieving Ethereum address - unknown Ethereum network specified. Proper values are "mainnet", "ropsten", "kovan", "rinkeby". Got : ' + settings.network)
        }

        this._settings = settings
        this._etherscanApiPathDeposits = false


        if (settings.currencyCode === 'BNB_SMART' || (typeof settings.tokenBlockchain !== 'undefined' && settings.tokenBlockchain === 'BNB')) {
            this._web3Link = BlocksoftExternalSettings.getStatic('BNB_SMART_SERVER')

            this._etherscanSuffix = ''
            this._etherscanApiPath = `https://api.bscscan.com/api?module=account&sort=desc&action=txlist&apikey=YourApiKeyToken`
            this._etherscanApiPathInternal = `https://api.bscscan.com/api?module=account&sort=desc&action=txlistinternal&apikey=YourApiKeyToken`

            this._trezorServer = false
            this._trezorServerCode = false

            this._mainCurrencyCode = 'BNB'
            this._mainTokenType = 'BNB_SMART_20'
            this._mainTokenBlockchain = 'Binance'
            this._mainChainId = false
        } else if (settings.currencyCode === 'ETC') {
            this._web3Link = BlocksoftExternalSettings.getStatic('ETC_SERVER')

            this._etherscanSuffix = false
            this._etherscanApiPath = false
            this._etherscanApiPathInternal = false

            this._trezorServer = 'to_load'
            this._trezorServerCode = 'ETC_TREZOR_SERVER'

            this._mainCurrencyCode = 'ETC'
            this._mainTokenType = 'ETC_ERC_20'
            this._mainTokenBlockchain = 'Ethereum Classic'
            this._mainChainId = 61 // https://ethereumclassic.org/development/porting
        } else if (settings.currencyCode === 'OPTIMISM') {
            this._web3Link = BlocksoftExternalSettings.getStatic('OPTIMISM_SERVER')

            this._etherscanSuffix = ''
            this._etherscanApiPath = `https://api.optimistic.etherscan.io/api?module=account&sort=desc&action=txlist&apikey=YourApiKeyToken`
            this._etherscanApiPathInternal = `https://api.optimistic.etherscan.io/api?module=account&sort=desc&action=txlistinternal&apikey=YourApiKeyToken`
            this._etherscanApiPathDeposits = 'https://api-optimistic.etherscan.io/api?module=account&action=getdeposittxs'

            this._trezorServer = false
            this._trezorServerCode = false

            this._mainCurrencyCode = 'OPTIMISM'
            this._mainTokenType = 'OPTI_ERC_20'
            this._mainTokenBlockchain = 'Optimistic Ethereum'
            this._mainChainId = 10 // https://community.optimism.io/docs/developers/metamask.html#connecting-with-chainid-link
        } else if (settings.currencyCode === 'AMB') {
            this._web3Link = BlocksoftExternalSettings.getStatic('AMB_SERVER')

            this._etherscanSuffix = false
            this._etherscanApiPath = false
            this._etherscanApiPathInternal = false

            this._trezorServer = 'to_load'
            this._trezorServerCode = 'AMB_TREZOR_SERVER'

            this._mainCurrencyCode = 'AMB'
            this._mainTokenType = 'AMB_ERC_20'
            this._mainTokenBlockchain = 'Ambrosus Network'
            this._mainChainId = 16718 // 0x414e
        } else if (settings.currencyCode === 'MATIC') {
            this._web3Link = BlocksoftExternalSettings.getStatic('MATIC_SERVER')

            this._etherscanSuffix = ''
            this._etherscanApiPath = `https://api.polygonscan.com/api?module=account&sort=desc&action=txlist&apikey=YourApiKeyToken`
            this._etherscanApiPathInternal = `https://api.polygonscan.com/api?module=account&sort=desc&action=txlistinternal&apikey=YourApiKeyToken`


            this._trezorServer = false
            this._trezorServerCode = false

            this._mainCurrencyCode = 'MATIC'
            this._mainTokenType = 'MATIC_ERC_20'
            this._mainTokenBlockchain = 'Polygon Network'
            this._mainChainId = 137
        } else if (settings.currencyCode === 'RSK') {
            this._web3Link = BlocksoftExternalSettings.getStatic('RSK_SERVER')

            this._etherscanSuffix = false
            this._etherscanApiPath = false
            this._etherscanApiPathInternal = false

            this._trezorServer = false
            this._trezorServerCode = false

            this._mainCurrencyCode = 'RSK'
            this._mainTokenType = 'RSK_ERC_20'
            this._mainTokenBlockchain = 'RSK Network'
            this._mainChainId = 30
        } else {

            this._etherscanSuffix = (settings.network === 'mainnet') ? '' : ('-' + settings.network)
            this._etherscanApiPath = `https://api${this._etherscanSuffix}.etherscan.io/api?module=account&sort=desc&action=txlist&apikey=YourApiKeyToken`
            this._etherscanApiPathInternal = `https://api${this._etherscanSuffix}.etherscan.io/api?module=account&sort=desc&action=txlistinternal&apikey=YourApiKeyToken`

            if (settings.network === 'mainnet') {
                this._trezorServer = 'to_load'
                this._trezorServerCode = 'ETH_TREZOR_SERVER'
            } else if (settings.network === 'ropsten') {
                this._trezorServer = 'to_load'
                this._trezorServerCode = 'ETH_ROPSTEN_TREZOR_SERVER'
            } else {
                this._trezorServer = false
                this._trezorServerCode = false
            }

            this._mainCurrencyCode = 'ETH'
            this._mainTokenType = 'ETH_ERC_20'
            this._mainTokenBlockchain = 'Ethereum'
            this._mainChainId = false
        }


        // noinspection JSUnresolvedVariable
        this._web3 = new Web3(new Web3.providers.HttpProvider(this._web3Link))
        this._tokenAddress = false
    }

    checkError(e, data, txRBF = false, logData = {}) {

        if (e.message.indexOf('nonce too low') !== -1) {
            BlocksoftCryptoLog.log('EthBasic checkError0.1 ' + e.message + ' for ' + data.addressFrom, logData)
            let e2
            if (txRBF) {
               e2 = new Error('SERVER_RESPONSE_TRANSACTION_ALREADY_MINED')
            } else {
               e2 = new Error('SERVER_RESPONSE_NONCE_ALREADY_MINED')
            }
            let nonce = logData.nonce || logData.setNonce
            if (typeof nonce === 'undefined') {
                nonce = ''
            }
            e2.logData = {nonce}
            throw e2
        } else if (e.message.indexOf('gas required exceeds allowance') !== -1) {
            BlocksoftCryptoLog.log('EthBasic checkError0.2 ' + e.message + ' for ' + data.addressFrom, logData)
            if (this._settings.currencyCode === 'ETH') {
                throw new Error('SERVER_RESPONSE_TOO_MUCH_GAS_ETH')
            } else {
                throw new Error('SERVER_RESPONSE_TOO_MUCH_GAS_ETH_ERC_20')
            }
        } else if (e.message.indexOf('insufficient funds') !== -1) {
            BlocksoftCryptoLog.log('EthBasic checkError0.3 ' + e.message + ' for ' + data.addressFrom, logData)
            if ((this._settings.currencyCode === 'ETH' || this._settings.currencyCode === 'BNB_SMART') && data.amount * 1 > 0) {
                throw new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
            } else {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
            }
        } else if (e.message.indexOf('underpriced') !== -1) {
            BlocksoftCryptoLog.log('EthBasic checkError0.4 ' + e.message + ' for ' + data.addressFrom, logData)
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
        } else if (e.message.indexOf('already known') !== -1) {
            BlocksoftCryptoLog.log('EthBasic checkError0.5 ' + e.message + ' for ' + data.addressFrom, logData)
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
        } else if (e.message.indexOf('infura') !== -1) {
            BlocksoftCryptoLog.log('EthBasic checkError0.6 ' + e.message + ' for ' + data.addressFrom, logData)
            throw new Error('SERVER_RESPONSE_BAD_INTERNET')
        } else {
            MarketingEvent.logOnlyRealTime('v20_' + this._mainCurrencyCode.toLowerCase() + '_tx_error ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo + ' ' + e.message, logData)
            throw e
        }
    }
}
