/**
 * @version 0.5
 */
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

const USDT_TOKEN_ID = 31
const USDT_API = 'https://api.wallet.trustee.deals/omni-get-balance'
const USDT_TX_API = 'https://microscanners.trustee.deals/txs'

export default class UsdtScannerProcessor {
    /**
     * @type {number}
     */
    lastBlock = 0

    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 3


    /**
     * @param {string} address
     * @return {Promise<{int:balance, int:provider}>}
     */
    async getBalance(address) {
        BlocksoftCryptoLog.log('UsdtScannerProcessor.getBalance started', address)
        // noinspection JSUnresolvedFunction
        let tmp = await BlocksoftAxios.post(USDT_API, {
                address : address,
                tokenID : USDT_TOKEN_ID
            });
        if (tmp.data.state && tmp.data.state === 'fail') {
            throw new Error('UsdtScannerProcessor.getBalance node is out')
        }
        if (typeof(tmp.data.data.balance) === 'undefined') {
            throw new Error('UsdtScannerProcessor.getBalance nothing loaded for address')
        }
        let balance = tmp.data.data.balance
        BlocksoftCryptoLog.log('UsdtScannerProcessor.getBalance finished', address + ' => ' + balance)
        return {balance, provider: 'microscanners', unconfirmed : 0}
    }

    /**
     * @param {string} address
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactions(address) {
        address = address.trim()
        BlocksoftCryptoLog.log('UsdtScannerProcessor.getTransactions started', address)
        let link = `${USDT_TX_API}/${address}`
        let tmp  = await BlocksoftAxios.getWithoutBraking(link)
        if (!tmp || typeof tmp.data === 'undefined' || !tmp.data) {
            return []
        }

        tmp = tmp.data
        if (tmp.data) {
            tmp = tmp.data // wtf but ok to support old wallets
        }
        if (typeof tmp.transactions === 'undefined') {
            throw new Error('Undefined txs ' + link + ' ' + JSON.stringify(tmp))
        }

        let transactions = []
        if (tmp.lastBlock > this.lastBlock) {
            this.lastBlock = tmp.lastBlock
        }
        for (let tx of tmp.transactions) {
            let transaction = await this._unifyTransaction(address, tx)
            transactions.push(transaction)
        }
        BlocksoftCryptoLog.log('UsdtScannerProcessor.getTransactions finished', address)
        return transactions
    }

    /**
     *
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.block_number: 467352,
     * @param {string} transaction.transaction_block_hash: '0000000000000000018e86423804e917c75348090419a46e506bc2d4818c2827',
     * @param {string} transaction.transaction_hash: '7daaa478c829445c967d4607345227286a23acd20f5bc80709e418d0e286ecf1',
     * @param {string} transaction.transaction_txid: '7daaa478c829445c967d4607345227286a23acd20f5bc80709e418d0e286ecf1',
     * @param {string} transaction.from_address: '1GYmxyavRvjCMsmfDR2uZLMsCPoFNYw9zM',
     * @param {string} transaction.to_address: '1Po1oWkD2LmodfkBYiAktwh76vkF93LKnh',
     * @param {string} transaction.amount: 0.744019,
     * @param {string} transaction.fee: 0.0008,
     * @param {string} transaction.custom_type: '',
     * @param {string} transaction.custom_valid: '',
     * @param {string} transaction.created_time: '2017-05-20T22:28:15.000Z',
     * @param {string} transaction.updated_time: null,
     * @param {string} transaction.removed_time: null,
     * @param {string} transaction._removed: 0,
     * @return {UnifiedTransaction}
     * @private
     */
    async _unifyTransaction(address, transaction) {
        let confirmations = this.lastBlock - transaction.block_number
        let transaction_status = confirmations > this._blocksToConfirm ? 'success' : 'new'
        return {
            transaction_hash: transaction.transaction_txid,
            block_hash: transaction.transaction_block_hash,
            block_number: +transaction.block_number,
            block_time: transaction.created_time,
            block_confirmations: confirmations,
            transaction_direction: (address.toLowerCase() === transaction.from_address.toLowerCase()) ? 'outcome' :  'income',
            address_from: transaction.from_address,
            address_to: transaction.to_address,
            address_amount: transaction.amount,
            transaction_status: (transaction.custom_valid.toString() === '1' && transaction._removed.toString() === '0') ? transaction_status : 'fail',
            transaction_fee : BlocksoftUtils.toSatoshi(transaction.fee),
            input_value : transaction.custom_type
        }
    }
}
