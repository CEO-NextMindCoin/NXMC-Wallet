/**
 * @version 0.42
 * @author Vadym
 */

import React from 'react'
import {
    Text,
    View,
    StyleSheet
} from 'react-native'

import { ProgressCircle } from 'react-native-svg-charts'

import { useTheme } from '@app/theme/ThemeProvider'


const ProgressCircleBox = (props) => {

    const {
        additionalStyles,
        progress,
        procent,
        title
    } = props

    const {
        colors
    } = useTheme()

    return(
        <View style={[styles.circleBox, additionalStyles]}>
            <View>
                <ProgressCircle style={styles.progressCircle} strokeWidth={3.5} progress={progress} backgroundColor={colors.cashback.chartBg} progressColor={colors.cashback.token} />
            </View>
            <View style={styles.circleInfo}>
                <Text style={[styles.circleTitle, { color: colors.common.text3 }]}>{title}</Text>
                <Text style={styles.circleProcent}>{(procent >= 100 ? '100' : procent) + ' %'}</Text>
            </View>
        </View>
    )
}

export default ProgressCircleBox

const styles = StyleSheet.create({
    circleBox: {
        flex: 1,
            alignItems: 'flex-start',
            flexDirection: 'row',
            marginLeft: 17
    },
    progressCircle: {
        height: 34,
        width: 34
    },
    circleTitle: {
        marginTop: 3,
        fontSize: 14,
        fontFamily: 'Montserrat-SemiBold',
        lineHeight: 14
    },
    circleProcent: {
        marginTop: 4,
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 15,
        lineHeight: 15,
        letterSpacing: 1.75,
        color: '#999999'
    },
    circleInfo: {
        flex: 1,
        marginLeft: 9
    }
})
