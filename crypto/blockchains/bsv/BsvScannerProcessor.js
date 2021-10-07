/**
 * @version 0.5
 * https://bsv.btc.com/api-doc
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftUtils from '../../common/BlocksoftUtils'

const API_PATH = 'https://bsv-chain.api.btc.com/v3/address/'
const API_TX_PATH = 'https://bsv-chain.api.btc.com/v3/address/'

const CACHE = {
    CACHE_BALANCE: {}
}
export default class BsvScannerProcessor {
    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 10

    /**
     * https://bsv-chain.api.btc.com/v3/address/18SZd38c139X7z8UCCnZHSAnzYhUhrSR7k
     * @param {string} address
     * @return {Promise<{int:balance, int:provider}>}
     */
    async getBalanceBlockchain(address) {
        if (typeof CACHE.CACHE_BALANCE[address] !== 'undefined' && CACHE.CACHE_BALANCE[address]) {
            await BlocksoftCryptoLog.log('BtcSvScannerProcessor.getBalanceBlockchain started ' + address + ' from cache')
            return CACHE.CACHE_BALANCE[address]
        }
        const link = API_PATH + address
        await BlocksoftCryptoLog.log('BtcSvScannerProcessor.getBalanceBlockchain started ' + address + ' ' + link)
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || !res.data || typeof res.data.data === 'undefined') {
            return false
        }
        if (!res.data.data || typeof res.data.data.balance === 'undefined') {
            if (typeof res.data.err_no !== 'undefined' && !res.data.err_no) {
                return { balance: 0, unconfirmed: 0, provider: 'btc.com-emptyisok' }
            } else {
                return false
            }
        }
        const formatted = { balance: res.data.data.balance, unconfirmed: 0, provider: 'btc.com' }
        CACHE.CACHE_BALANCE[address] = formatted
        return formatted
    }

    /**
     * https://explorer.viabtc.com/res/bsv/transactions/addressv2?address=1KiTAxJQJ2cv4hTZsJXtCgc3ZaaqZCF7Un
     * https://bsv-chain.api.btc.com/v3/address/1KiTAxJQJ2cv4hTZsJXtCgc3ZaaqZCF7Un/tx
     * @param {string} scanData.account.address
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactionsBlockchain(scanData) {
        const address = scanData.account.address.trim()
        const link = API_TX_PATH + address + '/tx'
        await BlocksoftCryptoLog.log('BtcSvScannerProcessor.getTransactions started ' + address + ' ' + link)
        try {
            const tmp = await BlocksoftAxios.getWithoutBraking(link)
            if (!tmp || typeof tmp.data === 'undefined' || !tmp.data || typeof tmp.data.data === 'undefined' || !tmp.data.data || typeof tmp.data.data.list === 'undefined' || !tmp.data.data.list) {
                await BlocksoftCryptoLog.log('BtcSvScannerProcessor.getTransactions no data ' + address)
                return []
            }
            const transactions = []
            await BlocksoftCryptoLog.log('BtcSvScannerProcessor.getTransactions data ' + address, tmp.data.data.list)
            for (const tx of tmp.data.data.list) {
                const transaction = await this._unifyTransaction(address, tx)
                transactions.push(transaction)
            }
            await BlocksoftCryptoLog.log('BtcSvScannerProcessor.getTransactions finished ' + address + ' total: ' + transactions.length)
            CACHE.CACHE_BALANCE[address] = false
            return transactions
        } catch (e) {
            if (e.message.indexOf('403 forbidden') === -1) {
                throw e
            }
            return []
        }
    }

    async _unifyTransaction(address, transaction) {
        const showAddresses = {
            to: address,
            from: address
        }
        if (transaction.balance_diff < 0) {
            transaction.balance_diff = Math.abs(transaction.balance_diff)
            showAddresses.direction = 'outcome'
            if (typeof transaction.outputs !== 'undefined') {
                let vout
                for (vout of transaction.outputs) {
                    if (vout.addresses[0] && vout.addresses[0] !== address) {
                        showAddresses.to = vout.addresses[0]
                    }
                }
            }
        } else {
            showAddresses.direction = 'income'
            if (typeof transaction.inputs !== 'undefined') {
                let vin
                for (vin of transaction.inputs) {
                    if (vin.prev_addresses[0] && vin.prev_addresses[0] !== address) {
                        showAddresses.from = vin.prev_addresses[0]
                    }
                }
            }
        }
        showAddresses.value = transaction.balance_diff

        if (typeof transaction.block_time === 'undefined') {
            throw new Error(' no transaction.time error transaction data ' + JSON.stringify(transaction))
        }
        let formattedTime = transaction.block_time
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.block_time)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        const confirmations = transaction.confirmations * 1
        let transactionStatus = 'new'
        if (confirmations > this._blocksToConfirm) {
            transactionStatus = 'success'
        } else if (confirmations > 0) {
            transactionStatus = 'confirming'
        }
        return {
            transactionHash: transaction.hash,
            blockHash: transaction.block_hash,
            blockNumber: +transaction.block_height,
            blockTime: formattedTime,
            blockConfirmations: confirmations,
            transactionDirection: showAddresses.direction,
            addressFrom: showAddresses.from === address ? '' : showAddresses.from,
            addressTo: showAddresses.to === address ? '' : showAddresses.to,
            addressAmount: showAddresses.value,
            transactionStatus: transactionStatus,
            transactionFee: transaction.fee
        }
    }
}
