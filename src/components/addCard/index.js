import React, { Component } from 'react'
import { ActivityIndicator, Platform, View, Image, TextInput, Text } from 'react-native'
import _ from 'lodash'
import s from 'string'
import payment from 'payment'
import KeyboardSpacer from 'react-native-keyboard-spacer'
import { CardIOModule, CardIOUtilities } from 'react-native-awesome-card-io'
import defaultStyles from './defaultStyles.js'
import TouchableOpacity from '../common/touchableOpacity'
import { formatMonthYearExpiry } from '../../common/cardFormatting'
import cardFront from '../../../assets/images/card_front.png'
import cardExpiry from '../../../assets/images/card_expiry.png'
import cardCvc from '../../../assets/images/card_cvc.png'

const DELAY_FOCUS = Platform.OS === 'android' ? 200 : 0
export default class AddCard extends Component {
  static propTypes = {
    addCardHandler: React.PropTypes.func.isRequired,
    onCardNumberBlur: React.PropTypes.func,
    onCardNumberFocus: React.PropTypes.func,
    onCvcFocus: React.PropTypes.func,
    onCvcBlur: React.PropTypes.func,
    onExpiryBlur: React.PropTypes.func,
    onExpiryFocus: React.PropTypes.func,
    styles: React.PropTypes.object,
    activityIndicatorColor: React.PropTypes.string,
    addCardButtonText: React.PropTypes.string,
  }

  static defaultProps = {
    activityIndicatorColor: 'black',
    addCardButtonText: 'Add Card',
  }

  constructor(props) {
    super(props)
    this.state = {
      addingCard: false,
      cardNumberDirty: false,
      cardNumber: '',
      error: null,
      expiry: '',
      cvc: ''
    }
  }

  componentWillMount() {
    if (CardIOUtilities.preload) {
      CardIOUtilities.preload()
    }
  }

  componentDidMount() {
    this.refs.cardNumberInput.focus()
  }

  isCardNumberValid() {
    return payment.fns.validateCardNumber(this.state.cardNumber)
  }
  isExpiryValid() {
    return payment.fns.validateCardExpiry(this.state.expiry)
  }
  isCvcValid() {
    return payment.fns.validateCardCVC(this.state.cvc)
  }

  calculatedState() {
    const cardNumberShowError = this.state.cardNumberDirty && !this.isCardNumberValid()
    const expiryShowError = this.state.expiryDirty && !this.isExpiryValid()
    const cvcShowError = this.state.cvcDirty && !this.isCvcValid()
    let error = ''
    if (cardNumberShowError) {
      error = 'Card Number is incorrect'
    } else if (expiryShowError) {
      error = 'Expiry is incorrect'
    } else if (cvcShowError) {
      error = 'CVC is incorrect'
    }
    return {
      ...this.state,
      error: this.state.error || error,
      cardNumberShowError: cardNumberShowError,
      expiryShowError: expiryShowError,
      cvcShowError: cvcShowError,
      cardNumberFormatted: payment.fns.formatCardNumber(this.state.cardNumber),
    }
  }

  render() {
    const styles = _.merge({}, defaultStyles, this.props.styles)
    const calculatedState = this.calculatedState()
    if (calculatedState.addingCard) {
      return (
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator color={this.props.activityIndicatorColor} size="large" style={styles.activityIndicator} />
        </View>
      )
    }
    const addCardContents = (
      <View>
        <View style={[styles.cardNumberContainer, calculatedState.cardNumberShowError && styles.invalid]}>
          <Image resizeMode="contain" style={styles.cardNumberImage} source={cardFront} />
          <TextInput
            ref="cardNumberInput"
            keyboardType="numeric"
            underlineColorAndroid="transparent"
            style={styles.cardNumberInput}
            onChangeText={(rawCardNumber) => {
              const cardNumber = s(rawCardNumber).replaceAll(' ', '').s
              this.setState({ cardNumber: cardNumber })
              if (payment.fns.validateCardNumber(cardNumber)) {
                this.refs.expiryInput.focus()
              }
            }}
            value={calculatedState.cardNumberFormatted}
            placeholder="4242 4242 4242 4242"
            onFocus={() => this.props.onCardNumberFocus && this.props.onCardNumberFocus(calculatedState.cardNumber)}
            onBlur={() => {
              if (this.props.onCardNumberBlur) {
                this.props.onCardNumberBlur(calculatedState.cardNumber)
              }
              this.setState({ cardNumberDirty: true })
            }}
          />
        </View>
        <View style={styles.monthYearCvcContainer}>
          <View style={[styles.monthYearContainer, calculatedState.expiryShowError && styles.invalid]}>
            <Image resizeMode="contain" style={styles.cardExpiryImage} source={cardExpiry} />
            <TextInput
              ref="expiryInput"
              maxLength={5}
              keyboardType="numeric"
              underlineColorAndroid="transparent"
              style={styles.monthYearTextInput}
              onChangeText={(expiry) => {
                const newExpiry = formatMonthYearExpiry(expiry, calculatedState.expiry)
                this.setState({ expiry: newExpiry })
                if (_.size(newExpiry) === 5) {
                  if (payment.fns.validateCardExpiry(newExpiry)) {
                    this.refs.cvcInput.focus()
                  } else {
                    this.setState({ expiryDirty: true })
                  }
                }
              }}
              value={calculatedState.expiry}
              placeholder="MM/YY"
              onFocus={() => this.props.onExpiryFocus && this.props.onExpiryFocus(calculatedState.expiry)}
              onBlur={() => {
                this.setState({ expiryDirty: true })
                if (this.props.onExpiryBlur) {
                  this.props.onExpiryBlur(calculatedState.expiry)
                }
              }}
            />
          </View>
          <View style={[styles.cvcContainer, calculatedState.cvcShowError && styles.invalid]}>
            <Image resizeMode="contain" style={styles.cvcImage} source={cardCvc} />
            <TextInput
              ref="cvcInput"
              keyboardType="numeric"
              underlineColorAndroid="transparent"
              style={styles.cvcInput}
              onChangeText={(cvc) => this.setState({ cvc })}
              value={calculatedState.cvc}
              placeholder="CVC"
              onFocus={() => this.props.onCvcFocus && this.props.onCvcFocus(calculatedState.cvc)}
              onBlur={() => {
                this.setState({ cvcDirty: true })
                if (this.props.onCvcBlur) {
                  this.props.onCvcBlur(calculatedState.cvc)
                }
              }}
            />
          </View>
        </View>
        <View style={styles.errorTextContainer}>
          <Text style={styles.errorText}>{calculatedState.error}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          styles={styles}
          onPress={() => {
            this.setState({ expiryDirty: true, cardNumberDirty: true, cvcDirty: true })
            if (this.isCardNumberValid() && this.isExpiryValid() && this.isCvcValid()) {
              this.setState({ addingCard: true })
              this.props.addCardHandler(calculatedState.cardNumber, calculatedState.expiry, calculatedState.cvc)
                .then(() => this.setState({ addingCard: false }))
                .catch((error) => this.setState({ error: error.message, addingCard: false }))
            }
          }}
          last
        >
          <Text style={styles.addButtonText}>{this.props.addCardButtonText}</Text>
        </TouchableOpacity>
      </View>
    )
    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.addCardContainer, this.props.style]}>
          {addCardContents}
        </View>
        {Platform.OS === 'android' ? null : <KeyboardSpacer /> /* Android takes care of this for us. */}
      </View>
    )
  }
}
