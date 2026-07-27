import React from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions, Text } from 'react-native';
import { getFontFamily } from '../utils/platform';

const { width, height } = Dimensions.get('window');

interface LoaderProps {
    value?: string,
    color?: string,
    testID?: string,
}

export const Loader = (props: LoaderProps) => {
    const { value = 'Loading', color = '#B62020', testID } = props;
    return (
        <View testID={testID} style={[styles.loaderContainer]}>
            <ActivityIndicator color={color} size="large" animating={true} />
            {Boolean(value) && <Text style={[styles.loaderText, { fontFamily: getFontFamily('body') },]}>{value}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    loaderContainer: {
        position: 'absolute',
        height,
        width,
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF00',
        zIndex: 1000,
    },
    loaderText: {
        fontSize: 16,
        color: '#666666',
        marginTop: 10,
        textAlign: 'center',
    },
})