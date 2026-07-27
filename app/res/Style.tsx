import React from 'react';
import { StyleSheet, Dimensions, I18nManager } from 'react-native';
import { Color } from './Color';
import Utils from '../helpers/Utilities';

const deviceHeight = Dimensions.get('window').height
const deviceWidth = Dimensions.get('window').width

export default StyleSheet.create({
    // Loader

    loaderContainer: {
        position: 'absolute',
        height: deviceHeight,
        width: deviceWidth,
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: Color.transparentBlack,
        zIndex: 1000,
    },
})