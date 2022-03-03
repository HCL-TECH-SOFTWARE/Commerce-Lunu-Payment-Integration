/*
 *==================================================
 * Licensed Materials - Property of HCL Technologies
 *
 * HCL Commerce
 *
 * (C) Copyright HCL Technologies Limited 2020
 *
 *==================================================
 */
//Standard libraries
import React, { useState, useEffect, useMemo, ChangeEvent } from "react";
import { useSelector, useDispatch } from "react-redux";
import Axios, { Canceler } from "axios";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import {
  IS_PERSONAL_ADDRESS_ALLOWED,
  STRING_TRUE,
  EMPTY_STRING,
} from "../../../../constants/common";
//Foundation libraries
import { useSite } from "../../../../_foundation/hooks/useSite";
import { localStorageUtil } from "../../../../_foundation/utils/storageUtil";
import paymentInstructionService from "../../../../_foundation/apis/transaction/paymentInstruction.service";
import { ACCOUNT } from "../../../../_foundation/constants/common";
//Custom libraries
import { PAYMENT_CONFIGS } from "../../../../configs/order";
import { PAYMENT, PO_NUMBER } from "../../../../constants/order";
import * as ROUTES from "../../../../constants/routes";
import { PaymentMethodContainer } from "../../../widgets/payment-method-container";
import { PaymentInfoList } from "../../../widgets/payment-info-list";
import { PurchaseOrderNumber } from "../../../widgets/purchase-order-number";
import storeUtil from "../../../../utils/storeUtil";
//Redux
import {
  isCheckoutDisabledSelector,
  payMethodsSelector,
  cartSelector,
} from "../../../../redux/selectors/order";
import { addressDetailsSelector } from "../../../../redux/selectors/account";
import {
  organizationDetailsSelector,
  activeOrgSelector,
} from "../../../../redux/selectors/organization";
import * as orderActions from "../../../../redux/actions/order";
import * as organizationAction from "../../../../redux/actions/organization";
import * as accountActions from "../../../../redux/actions/account";
//UI
import { Divider } from "@material-ui/core";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import {
  StyledBox,
  StyledButton,
  StyledGrid,
  StyledPaper,
  StyledSwitch,
  StyledTypography,
} from "../../../StyledUI";
import paypalService from "../../../../_foundation/apis/paypal/paypal.service";
import { ok } from "assert";
import cybersourceService from "../../../../_foundation/apis/cybersource/cybersource.service";
import lunuService from "../../../../_foundation/apis/lunu/lunu.service";

interface CreditCardFormDataType {
  account: string;
  expire_month: string;
  expire_year: string;
  cc_cvc: string;
}

export const CREDITCARDFORMDATA_INIT: CreditCardFormDataType = {
  account: "",
  expire_month: "",
  expire_year: "",
  cc_cvc: "",
};

export interface PaymentInfoType {
  payMethodId: string;
  creditCardFormData: CreditCardFormDataType;
  addressId: string;
  piAmount: string;
  paymentTermConditionId: string;
  title: string;
  policyId: string;
}

/**
 * Payment section
 * displays payment method and billing address selection
 * @param props
 */
const Payment: React.FC = (props: any) => {
  const { isPONumberRequired } = props;
  const isCheckoutDisabled = useSelector(isCheckoutDisabledSelector);
  const payMethods = useSelector(payMethodsSelector);
  const addressDetails: any = useSelector(addressDetailsSelector);
  const cart = useSelector(cartSelector);
  const orgAddressDetails = useSelector(organizationDetailsSelector);
  const activeOrgId = useSelector(activeOrgSelector);
  const [currentPaymentNumber, setCurrentPaymentNumber] = useState<number>(0);
  const selectedPayMethod = props.selectedPayMethod
    ? props.selectedPayMethod
    : PAYMENT.paymentMethodName.cod;

  const [cardTypeVal, setCardTypeVal] = React.useState<string>("");
  const dispatch = useDispatch();
  const history = useHistory();
  const { t } = useTranslation();
  const { mySite } = useSite();
  const CancelToken = Axios.CancelToken;
  let cancels: Canceler[] = [];
  let selectedPayment: string = "";

  const isB2B = mySite ? mySite.isB2B : false;
  const PAYMENT_INFO_INIT: PaymentInfoType = {
    payMethodId: selectedPayMethod,
    creditCardFormData: CREDITCARDFORMDATA_INIT,
    addressId: "",
    piAmount: cart.grandTotal,
    paymentTermConditionId: "",
    policyId: "",
    title: "",
  };
  const [selectedPaymentInfoList, setSelectedPaymentInfoList] = useState<
    PaymentInfoType[]
  >([]);

  const usableBillAddresses = useMemo(() => initUsableBillingAddresses(), [
    addressDetails,
    orgAddressDetails,
    selectedPaymentInfoList,
    currentPaymentNumber,
    payMethods,
  ]);
  const [useMultiplePayment, setUseMultiplePayment] = useState<boolean>(false);

  const [createNewAddress, setCreateNewAddress] = useState<boolean>(false);
  const [editAddress, setEditAddress] = useState<boolean>(false);
  const [addNewPayment, setAddNewPayment] = useState<boolean>(false);
  const [poNumber, setPONumber] = useState<string>("");

  /**Paypal POC */
  const [showPaypal, setShowPaypal] = useState<boolean>(false);
  const [paypalTransactionFlag, setPaypalTransactionFlag] = useState<boolean>(false);
  const [paypalAddressdetails, setPaypalAddressDetails] = useState<any>({});
  const [paypalPayload, setPaypalPayload] = useState<any>({});
  useEffect(() => {
    if (addressDetails && cart) {
      setPaypalAddressDetails({
        grandTotal: cart.grandTotal,
        grandTotalCurrency: cart?.grandTotalCurrency,
        shipping: addressDetails?.contactList[0],
      })
    }
  }, [addressDetails, cart])
  /***PAypal POC */

  /**GooglePay POC */
  const [showGooglePay, setShowGooglePay] = useState<boolean>(false);
  const [googlePayTransactionFlag, setGooglePayTransactionFlag] = useState<boolean>(false);
  const [googlePayAddressdetails, setGooglePayAddressDetails] = useState<any>({});
  const [googlePayPayload, setGooglePayPayload] = useState<any>({});
  useEffect(() => {
    if (addressDetails && cart) {
      setGooglePayAddressDetails({
        grandTotal: cart.grandTotal,
        grandTotalCurrency: cart?.grandTotalCurrency,
        shipping: addressDetails?.contactList[0],
      })
    }
  }, [addressDetails, cart])
  /***GooglePay POC */

  /**Lunu POC */
  const[timeStamp, setTimeStamp] = React.useState<any>(Date.now().toString());
  const [lunuTransactionFlag, setLunuTransactionFlag] = useState<boolean>(false);
  const [lunuAddressdetails, setLunuAddressDetails] = useState<any>({});
  const [lunuPayload, setLunuPayload] = useState<any>({});
  const [lunuRequest,setLunuRequest]=useState<any>({});
  useEffect(() => {
    if (addressDetails && cart) {
      setLunuAddressDetails({
        grandTotal: cart.grandTotal,
        grandTotalCurrency: cart?.grandTotalCurrency,
        shipping: addressDetails?.contactList[0],
      })
      setLunuRequest({
        ...lunuRequest,
        amount: cart.grandTotal,
        email:addressDetails?.contactList[0].email1,
        orderId:cart.orderId,
        idempotenceKey: "hcl_" + cart.orderId + "_" + timeStamp
      })
    }
  }, [addressDetails, cart])
  /***Lunu POC */

  const allowMorePayments = useMemo(
    () => selectedPaymentInfoList.length < PAYMENT_CONFIGS.maxNumPayment,
    [selectedPaymentInfoList]
  );
  const handlePONumberChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newPONumber = event.target.value;
    setPONumber(newPONumber);
  };

  const isPersonalAddressAllowed: string =
    cart && cart[IS_PERSONAL_ADDRESS_ALLOWED]
      ? cart[IS_PERSONAL_ADDRESS_ALLOWED]
      : STRING_TRUE;

  const ACCOUNT_CC = "account";
  const ACCOUNT_FOR_VIEW_CC = "accountForView";
  const payloadBase: any = {
    cancelToken: new CancelToken(function executor(c) {
      cancels.push(c);
    }),
  };

  useEffect(() => {
    if (mySite) {
      let payload = {
        ...payloadBase,
      };
      dispatch(orderActions.GET_PAYMETHODS_ACTION(payload));
      dispatch(accountActions.GET_ADDRESS_DETAIL_ACTION(payload));
      const param: any = {
        storeId: mySite.storeId,
        organizationId: activeOrgId,
        ...payloadBase,
      };
      dispatch(organizationAction.GET_ORGANIZATION_ADDRESS_ACTION(param));

    }

    return () => {
      cancels.forEach((cancel) => cancel());
    };
  }, [mySite]);

  const setCardType = (data) => {
    setCardTypeVal(data);
  }

  useEffect(() => {
    if (cart?.paymentInstruction?.length > 0) {
      setSelectedPaymentInfoList(
        cart.paymentInstruction.map((pi) => {
          let payMethodId = pi.payMethodId;
          let paymentFromList = payMethods.filter(
            (payment) => payment.xumet_policyId === pi.xpaym_policyId
          )[0];

          let creditCardFormData = CREDITCARDFORMDATA_INIT;

          if (payMethodId !== PAYMENT.paymentMethodName.cod) {
            creditCardFormData = {
              ...creditCardFormData,
            };
          }

          const newPaymentInfo: PaymentInfoType = {
            payMethodId: payMethodId,
            creditCardFormData: creditCardFormData,
            addressId: pi.billing_address_id,
            piAmount: cart.grandTotal,
            paymentTermConditionId: paymentFromList?.paymentTermConditionId,
            policyId: pi.xpaym_policyId,
            title: paymentFromList?.description,
          };
          return newPaymentInfo;
        })
      );

      //Commented out for multiple payment
      /* if (cart.paymentInstruction.length === 1) {
        setUseMultiplePayment(false);
      } else {
        setUseMultiplePayment(true);
      } */
    }
  }, [cart]);

  useEffect(() => {
    if (cart && poNumber === "") {
      const poNumberFromStorage = localStorageUtil.get(
        ACCOUNT + "-" + PO_NUMBER + "-" + cart.orderId
      );

      if (poNumberFromStorage !== null && poNumberFromStorage !== "") {
        setPONumber(poNumberFromStorage);
      }
    }
  }, [cart]);

  /** Handle toggle between single/multiple payments */
  const handleMultiplePaymentChange = (event) => {
    const newUseMultiplePayment = event.target.checked;
    if (newUseMultiplePayment) {
      setSelectedPaymentInfoList([]);
      setCurrentPaymentNumber(-1);
    } else {
      const singlePaymentInit: PaymentInfoType = {
        ...PAYMENT_INFO_INIT,
        piAmount: cart.grandTotal,
      };
      setSelectedPaymentInfoList([singlePaymentInit]);
      setCurrentPaymentNumber(0);
    }
    setUseMultiplePayment(newUseMultiplePayment);
  };

  /** Handle adding new payments for multiple payments */
  const handleAddNewPayment = () => {
    if (allowMorePayments) {
      setAddNewPayment(true);
      setCurrentPaymentNumber(selectedPaymentInfoList.length);

      let newPaymentInfoList: PaymentInfoType[] = selectedPaymentInfoList.slice();
      newPaymentInfoList.push(PAYMENT_INFO_INIT);
      setSelectedPaymentInfoList(newPaymentInfoList);
    }
  };

  /** Handle cancelling new payments for multiple payments */
  const handleCancelNewPayment = () => {
    if (addNewPayment) {
      let newPaymentInfoList: PaymentInfoType[] = selectedPaymentInfoList.slice();
      newPaymentInfoList.pop();
      setSelectedPaymentInfoList(newPaymentInfoList);
      setCurrentPaymentNumber(newPaymentInfoList.length - 1);
    }
    setAddNewPayment(false);
  };

  /**
   * Initialize filtered billing addresses based on usable payment info
   */
  function initUsableBillingAddresses() {
    let filterList: any[] = [];
    if (selectedPaymentInfoList !== [] && currentPaymentNumber !== null) {
      let payment = selectedPaymentInfoList[currentPaymentNumber];
      if (payment) {
        let paymentFromList = payMethods.filter(
          (p) => p.xumet_policyId === payment.policyId
        )[0];

        let newUsableBillAddresses = paymentFromList?.usableBillingAddress;

        if (newUsableBillAddresses && newUsableBillAddresses.length > 0) {
          filterList = filterAddresses(newUsableBillAddresses);
          if (filterList && filterList.length > 0) {
            filterList = filterList.concat(
              filterOrgAddresses(newUsableBillAddresses)
            );
          } else {
            filterList = filterOrgAddresses(newUsableBillAddresses);
          }
        }
      }
    }
    return filterList;
  }

  /**
   * Filter out addresses that does not have the mandatory fields for checkout
   * @param usableAddresses List of addresses to scan
   * @returns Filtered list of addresses
   */
  function filterAddresses(usableAddresses: any[]) {
    if (usableAddresses) {
      const filteredList = usableAddresses.filter((address) => {
        if (address && addressDetails) {
          if (address.addressId === addressDetails.addressId) {
            return (
              addressDetails.addressLine !== undefined &&
              addressDetails.country !== undefined &&
              addressDetails.addressLine[0] !== EMPTY_STRING &&
              addressDetails.country !== EMPTY_STRING
            );
          } else if (
            addressDetails.contactMap &&
            addressDetails.contactMap[address.addressId]
          ) {
            const adressDetailsFromContact =
              addressDetails.contactMap[address.addressId];
            return (
              adressDetailsFromContact.addressLine !== undefined &&
              adressDetailsFromContact.country !== undefined &&
              adressDetailsFromContact.addressLine[0] !== EMPTY_STRING &&
              adressDetailsFromContact.country !== EMPTY_STRING
            );
          } else {
            return false;
          }
        }
        return false;
      });
      if (filteredList && filteredList.length > 0) {
        return filteredList;
      }
    }
    return [];
  }

  /**
   * Filter out organization addresses that does not have the mandatory fields for checkout
   * @param usableAddresses List of addresses to scan
   * @returns Filtered list of addresses
   */
  function filterOrgAddresses(usableAddresses: any[]) {
    if (usableAddresses) {
      const filteredList = usableAddresses.filter((address) => {
        if (
          address &&
          orgAddressDetails &&
          orgAddressDetails.contactInfo &&
          orgAddressDetails.addressBook
        ) {
          if (address.addressId === orgAddressDetails.contactInfo.addressId) {
            return (
              orgAddressDetails.contactInfo.address1 !== undefined &&
              orgAddressDetails.contactInfo.country !== undefined &&
              orgAddressDetails.contactInfo.address1 !== EMPTY_STRING &&
              orgAddressDetails.contactInfo.country !== EMPTY_STRING
            );
          } else {
            for (let orgAddress of orgAddressDetails.addressBook) {
              if (address.addressId === orgAddress.addressId) {
                return (
                  orgAddress.address1 !== undefined &&
                  orgAddress.country !== undefined &&
                  orgAddress.address1 !== EMPTY_STRING &&
                  orgAddress.country !== EMPTY_STRING
                );
              }
            }
          }
          return false;
        }
      });
      if (filteredList && filteredList.length > 0) {
        return filteredList;
      }
    }
    return [];
  }

  /** Sets the billing address id for the current payment method # */
  const setSelectedBillingAddressId = (newAddressId: string) => {
    let newPaymentInfo: PaymentInfoType = {
      ...selectedPaymentInfoList[currentPaymentNumber],
      addressId: newAddressId,
    };

    let newPaymentInfoList: PaymentInfoType[] = selectedPaymentInfoList.slice();
    newPaymentInfoList.splice(currentPaymentNumber, 1, newPaymentInfo);
    setSelectedPaymentInfoList(newPaymentInfoList);
  };

  /**
   * Handle pay option change
   * @param option The selected pay option
   */
  function togglePayOption(optionValue: number) {
    let payment = payMethods.filter((x) => x.xumet_policyId == optionValue)[0];
    let paymentTCId = payment?.paymentTermConditionId;
    selectedPayment = payment.paymentMethodName;

    let newPaymentInfo: PaymentInfoType = {
      ...selectedPaymentInfoList[currentPaymentNumber],
      payMethodId: payment?.paymentMethodName,
      creditCardFormData: CREDITCARDFORMDATA_INIT,
      piAmount: cart.grandTotal,
      paymentTermConditionId: paymentTCId ? paymentTCId : "",
      addressId: "",
      policyId: payment?.xumet_policyId,
      title: payment?.description,
    };
    if (
      paymentTCId &&
      paymentTCId !== "" &&
      payment.payMethodId !== PAYMENT.paymentMethodName.cod &&
      payment.payMethodId !== PAYMENT.paymentMethodName.paypal &&
      payment.payMethod !== PAYMENT.paymentMethodName.googlepay &&
      payment.payMethod !== PAYMENT.paymentMethodName.lunu
    ) {
      const formData: CreditCardFormDataType = {
        account: "",
        expire_month: "",
        expire_year: "",
        cc_cvc: "",
      };
      newPaymentInfo = {
        ...selectedPaymentInfoList[currentPaymentNumber],
        payMethodId: payment.paymentMethodName,
        creditCardFormData: formData,
        piAmount: cart.grandTotal,
        paymentTermConditionId: paymentTCId,
        addressId: "",
        policyId: payment?.xumet_policyId,
        title: payment?.description,
      };

      let newPaymentInfoList: PaymentInfoType[] = selectedPaymentInfoList.slice();
      newPaymentInfoList.splice(currentPaymentNumber, 1, newPaymentInfo);
      setSelectedPaymentInfoList(newPaymentInfoList);
    }
    if (payment.payMethodId === PAYMENT.paymentMethodName.paypal) {
      setShowPaypal(true);
    }
    let newPaymentInfoList: PaymentInfoType[] = selectedPaymentInfoList.slice();
    newPaymentInfoList.splice(currentPaymentNumber, 1, newPaymentInfo);
    setSelectedPaymentInfoList(newPaymentInfoList);
  }

  /**
   * Handle credit card form input changes
   * @param event The event handler
   */
  function handleCreditCardChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    paymentNumber: number
  ) {
    let newCreditCardFormData = {
      ...selectedPaymentInfoList[paymentNumber].creditCardFormData,
    };
    if (event.target.name.trim() !== "") {
      if (event.target.name === ACCOUNT_CC) {
        newCreditCardFormData[ACCOUNT_FOR_VIEW_CC] = event.target.value;
      }
      newCreditCardFormData[event.target.name] = event.target.value;

      let newPaymentInfo: PaymentInfoType = {
        ...selectedPaymentInfoList[paymentNumber],
        creditCardFormData: newCreditCardFormData,
      };

      let newPaymentInfoList: PaymentInfoType[] = selectedPaymentInfoList.slice();
      newPaymentInfoList.splice(paymentNumber, 1, newPaymentInfo);
      setSelectedPaymentInfoList(newPaymentInfoList);
    }
  }

  /**
   * Checks if the entered credit card number is a numeric value
   * @returns Whether the card number format is valid.
   */
  function isValidCardNumber(paymentNumber: number) {
    return (
      selectedPaymentInfoList[
        paymentNumber
      ]?.creditCardFormData.account?.trim() === "" ||
      storeUtil.isNumeric(
        selectedPaymentInfoList[
          paymentNumber
        ]?.creditCardFormData.account?.trim()
      )
    );
  }

  /**
   * Checks if the entered cvv code entered is a numeric value
   * @returns Whether the cvv code format is valid.
   */
  function isValidCode(paymentNumber: number) {
    return (
      selectedPaymentInfoList[
        paymentNumber
      ]?.creditCardFormData.cc_cvc?.trim() === "" ||
      storeUtil.isNumeric(
        selectedPaymentInfoList[
          paymentNumber
        ]?.creditCardFormData.cc_cvc?.trim()
      )
    );
  }

  /**
   * Validate billing address id for a payment
   * @returns Whether or not the billing address is valid
   */
  function isValidBillingAddress(paymentNumber: number) {
    if (
      paymentNumber >= selectedPaymentInfoList.length ||
      selectedPaymentInfoList[paymentNumber].addressId === ""
    ) {
      return false;
    }

    return true;
  }

  /**
   * Validate payment options/credit card for a payment
   * @returns Whether or not the payment method is valid
   */
  function isValidPaymentMethod(paymentNumber: number) {
    if (paymentNumber >= selectedPaymentInfoList.length) {
      return false;
    }

    if (
      selectedPaymentInfoList[paymentNumber].payMethodId !==
      PAYMENT.paymentMethodName.cod && selectedPaymentInfoList[paymentNumber].payMethodId !==
      PAYMENT.paymentMethodName.paypal && selectedPaymentInfoList[paymentNumber].payMethodId !==
      PAYMENT.paymentMethodName.googlepay && selectedPaymentInfoList[paymentNumber].payMethodId !==
      PAYMENT.paymentMethodName.lunu
    ) {
      if (
        selectedPaymentInfoList[paymentNumber].paymentTermConditionId === ""
      ) {
        for (let key in selectedPaymentInfoList[paymentNumber]
          .creditCardFormData) {
          if (
            selectedPaymentInfoList[paymentNumber].creditCardFormData[
              key
            ]?.trim() === ""
          ) {
            return false;
          }
        }
        if (isValidCardNumber(paymentNumber) === false) {
          return false;
        }
        if (
          isValidCode(paymentNumber) === false ||
          selectedPaymentInfoList[
            paymentNumber
          ]?.creditCardFormData.cc_cvc?.trim() === ""
        ) {
          return false;
        }
        if (
          selectedPaymentInfoList[paymentNumber].creditCardFormData.account ===
          ""
        ) {
          return false;
        }
      } else {
        if (isValidCode(paymentNumber) === false) {
          return false;
        }
      }
    }/**PaypalPOC */ else if (selectedPaymentInfoList[paymentNumber].payMethodId === PAYMENT.paymentMethodName.paypal) {
      return (paypalTransactionFlag) ? true : false;
    }/**PaypalPOC */ else if (selectedPaymentInfoList[paymentNumber].payMethodId === PAYMENT.paymentMethodName.googlepay) {
      return (googlePayTransactionFlag) ? true : false;
    } else if (selectedPaymentInfoList[paymentNumber].payMethodId === PAYMENT.paymentMethodName.lunu) {
      return (lunuTransactionFlag) ? true : false;
    }

    return true;
  }

  /**
   * Validate billing address id and payment options/credit card for a payment
   * @returns Whether or not the payment is valid
   */
  function isValidPayment(paymentNumber: number) {
    if (!isValidBillingAddress(paymentNumber)) {
      return false;
    }
    if (!isValidPaymentMethod(paymentNumber)) {
      return false;
    }
    return true;
  }

  /**
   * Validate billing address id list and payment options/credit card inputs for all payments
   * @returns Whether or not all payment selections is valid
   */
  function isValidPaymentList() {
    if (selectedPaymentInfoList.length < 1) {
      return false;
    }

    for (let i = 0; i < selectedPaymentInfoList.length; i++) {
      if (!isValidBillingAddress(i)) {
        return false;
      }
      if (!isValidPaymentMethod(i)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate whether po number is required and specified
   * @returns Whether po number is valid or needed
   */
  function isValidPO() {
    if (isPONumberRequired) {
      if (poNumber.trim() === "") {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate whether shopper can proceed to next step
   * @returns Whether next step is allowed
   */
  function canContinue() {
    return !isCheckoutDisabled && isValidPaymentList() && isValidPO();
  }

  //CyberSource function to call the API's
  async function formatDataForCyberSource(){
    var keyId = await cybersourceService.getFlexKey();
    const cardInfo = selectedPaymentInfoList[0];
    var objToken = {
      "cardInfo": {
        "cardNumber": cardInfo.creditCardFormData.account.trim(),
        "cardType": cardTypeVal
      },
      "keyId": keyId.data.keyId
    };

    try {
      var token = await cybersourceService.createFlexToken(objToken, keyId.data.URL);
      return token;
    } catch(err) {
      console.log("Error for card -- ", err);
    }
  }

  /**
   * Submit the selected payment method and billing address information
   */
  async function submit() {
    if (canContinue()) {
      if (isPONumberRequired && cart) {
        localStorageUtil.set(
          ACCOUNT + "-" + PO_NUMBER + "-" + cart.orderId,
          poNumber
        );
      }

      // if(selectedPaymentInfoList[0].payMethodId !== PAYMENT.paymentMethodName.lunu) {
        await paymentInstructionService.deleteAllPaymentInstructions({
          ...payloadBase,
        });

        for (let i = 0; i < 1; i++) {
          //Submit first PI only until Multiple payment feature is added
          const thisPayment = selectedPaymentInfoList[i];
          let payMethod = thisPayment.payMethodId;

          let body: any = {
            piAmount: selectedPaymentInfoList[i].piAmount,
            billing_address_id: selectedPaymentInfoList[i].addressId,
            payMethodId: payMethod,
          };
          if (
            selectedPaymentInfoList[i].payMethodId !==
            PAYMENT.paymentMethodName.cod && selectedPaymentInfoList[i].payMethodId !==
            PAYMENT.paymentMethodName.paypal && selectedPaymentInfoList[i].payMethodId !==
            PAYMENT.paymentMethodName.googlepay && selectedPaymentInfoList[i].payMethodId !==
            PAYMENT.paymentMethodName.lunu
          ) {
            if (selectedPaymentInfoList[i].paymentTermConditionId === "") {
              body = {
                ...body,
                account: thisPayment.creditCardFormData.account.trim(),
                expire_month: thisPayment.creditCardFormData.expire_month,
                expire_year: thisPayment.creditCardFormData.expire_year,
                cc_cvc: thisPayment.creditCardFormData.cc_cvc.trim(),
                cc_brand: (selectedPaymentInfoList[i].payMethodId === "CyberSource") ? cardTypeVal : payMethod,
              };
            } else {
              body = {
                ...body,
                account: EMPTY_STRING,
                cc_cvc: EMPTY_STRING,
                expire_month: EMPTY_STRING,
                expire_year: EMPTY_STRING,
                cc_brand: payMethod,
                valueFromPaymentTC: "true",
                paymentTermConditionId: thisPayment.paymentTermConditionId,
                valueFromProfileOrder: "",
                orderId: ".",
              };
            }
          }
          if (selectedPaymentInfoList[i].payMethodId === PAYMENT.paymentMethodName.paypal) {
            body = {
              ...body,
              ...paypalPayload
            };
          }
          if (selectedPaymentInfoList[i].payMethodId === PAYMENT.paymentMethodName.googlepay) {
            body = {
              ...body,
              ...googlePayPayload
            };
          }
          if (selectedPaymentInfoList[i].payMethodId === PAYMENT.paymentMethodName.lunu) {
            body = {
              ...body,
              ...lunuPayload
            };
          }
          if(selectedPaymentInfoList[i].payMethodId === PAYMENT.paymentMethodName.cybersource) {
            var res = await formatDataForCyberSource();
            body = {
              ...body,
              instrumentIdentifierId: res?.data._embedded.icsReply.instrumentIdentifier.id
            }
          }

          const payload = {
            ...payloadBase,
            body
          };

          await paymentInstructionService.addPaymentInstruction(payload);
        }
      // }
      history.push(ROUTES.CHECKOUT_REVIEW);
    }
  }

  /**Paypal POC */
  function updateBillingAddress(payload) {
    let { city, countryCode, line1, line2, postalCode, state, recipientName } = payload.details['billingAddress'];
    let body = {
      addressTypeFromPayPal: 'PayPalBillingAddress',
      addressType: 'B',
      recipientName: recipientName,
      address1: line1 || "",
      address2: line2 || "",
      city: city,
      state: state,
      countryCode: countryCode,
      postalCode: postalCode
    };
    paypalService.updateBillingAddress(body).then((data) => {
      // let finaldata = JSON.parse(data);
      var addressId = data['result']['updatedAddressId'];
      // setselectedBillAddressId(addressId);
      setPaypalPayloadData(payload);
    });
  }
  function setPaypalPayloadData(payload) {
    let deviceData = paypalService.getDeviceSessionData();
    setPaypalPayload({
      PayPalEmailId: payload.details.email,
      fraudMerchantId: deviceData['fraud_merchant_id'] || "",
      deviceSessionId: deviceData['device_session_id'] || "",
      fromSavedPaymentFlag: 'false',
      cvv_nonce: '',
      pay_token: '',
      pay_nonce: payload.nonce,
      pay_type: payload.type
    })
  }
  const node: any = React.useRef(null);
  function onSucessTransactionOfPaypal(payload) {
    if (payload.details['billingAddress']) {
      updateBillingAddress(payload);
    } else {
      setPaypalPayloadData(payload);
    }
    //paypalTransactionFlag=true;
    setPaypalTransactionFlag(true);
    //submit();
  }
  /**PayPal POC */

  function onSuccessTransactionGooglePayToken(payload) {
    if (payload.details['billingAddress']) {
      updateBillingAddress(payload);
    } else {
      //setGooglePayPayload
    }
    setGooglePayTransactionFlag(true);
  }

  async function onSuccessTransactionOfLunu(payload) {
    setLunuTransactionFlag(true);
    var resLunu = {
      amount: payload.amount,
      amount_orig: payload.amount_orig,
      confirmationToken: payload.confirmationToken,
      created_at: payload.created_at,
      id: payload.id,
      status: payload.status
    }
    setLunuPayload(resLunu);
  }

  /**
   * Go back to the previous checkout step
   */
  function back() {
    history.push(ROUTES.CHECKOUT_SHIPPING);
  }

  return (
    <StyledPaper className="vertical-padding-2 horizontal-padding-2">
      <StyledGrid
        container
        direction="row"
        alignments="center"
        justify="flex-start"
        spacing={2}>
        {!createNewAddress && !editAddress && !addNewPayment ? (
          <>
            <StyledGrid item>
              <StyledBox
                display="flex"
                flexDirection="row"
                alignItems="center"
                className="full-height">
                <StyledTypography variant="h4" component="p">
                  {t("Payment.Title")}
                </StyledTypography>
              </StyledBox>
            </StyledGrid>
            <StyledGrid item>
              <StyledSwitch
                checked={useMultiplePayment}
                setChecked={handleMultiplePaymentChange}
                label={t("Payment.Labels.UseMultiple")}
                disabled
              />
            </StyledGrid>
          </>
        ) : (
            <>
              <StyledGrid item>
                <StyledButton
                  variant="text"
                  onClick={() => {
                    setCreateNewAddress(false);
                    setEditAddress(false);
                    handleCancelNewPayment();
                  }}>
                  <StyledTypography variant="h4" component="p">
                    {t("Payment.Title")}
                  </StyledTypography>
                </StyledButton>
              </StyledGrid>
              {addNewPayment && (
                <>
                  <StyledGrid item>
                    <StyledBox
                      variant="div"
                      display="inline-flex"
                      alignItems="center"
                      className="full-height">
                      <ChevronRightIcon />
                    </StyledBox>
                  </StyledGrid>
                  <StyledGrid item>
                    <StyledTypography variant="h4" component="p">
                      {t("Payment.Labels.PaymentMethod", {
                        number: currentPaymentNumber + 1,
                      })}
                    </StyledTypography>
                  </StyledGrid>
                </>
              )}

              {createNewAddress ||
                editAddress ||
                (!isPersonalAddressAllowed && (
                  <>
                    <StyledGrid item>
                      <StyledBox
                        variant="div"
                        display="inline-flex"
                        alignItems="center"
                        className="full-height">
                        <ChevronRightIcon />
                      </StyledBox>
                    </StyledGrid>
                    {createNewAddress ? (
                      <StyledGrid item>
                        <StyledTypography variant="h4" component="p">
                          {t("Shipping.Labels.AddNewAddress")}
                        </StyledTypography>
                      </StyledGrid>
                    ) : (
                        <StyledGrid item>
                          <StyledTypography variant="h4" component="p">
                            {t("Shipping.Labels.EditAddress")}
                          </StyledTypography>
                        </StyledGrid>
                      )}
                  </>
                ))}
            </>
          )}
      </StyledGrid>
      <Divider className="top-margin-3 bottom-margin-2" />

      {isB2B && isPONumberRequired && !createNewAddress && !editAddress && (
        <>
          <PurchaseOrderNumber
            poNumber={poNumber}
            handlePONumberChange={handlePONumberChange}
            isValidPO={isValidPO}
          />
          <Divider className="top-margin-3 bottom-margin-2" />
        </>
      )}

      {!useMultiplePayment || (useMultiplePayment && addNewPayment) ? (
        <PaymentMethodContainer
          paymentInfo={selectedPaymentInfoList[currentPaymentNumber]}
          currentPaymentNumber={currentPaymentNumber}
          usableBillAddresses={usableBillAddresses}
          setSelectedAddressId={setSelectedBillingAddressId}
          setCreateNewAddress={setCreateNewAddress}
          createNewAddress={createNewAddress}
          editAddress={editAddress}
          setEditAddress={setEditAddress}
          togglePayOption={togglePayOption}
          handleCreditCardChange={handleCreditCardChange}
          isValidCardNumber={isValidCardNumber}
          isValidCode={isValidCode}
          useMultiplePayment={useMultiplePayment}
          paymentsList={payMethods}
          isPersonalAddressAllowed={isPersonalAddressAllowed}
          orgAddressDetails={orgAddressDetails}
          paypaladressDetails={paypalAddressdetails}
          onSucessTransactionOfPaypal={onSucessTransactionOfPaypal}
          onSuccessTransactionGooglePayToken={onSuccessTransactionGooglePayToken}
          lunuPaymentDetails ={lunuRequest}
          onSuccessTransactionOfLunu={onSuccessTransactionOfLunu}
          setCardType={setCardType}
        />
      ) : (
          <PaymentInfoList
            selectedPaymentInfoList={selectedPaymentInfoList}
            handleAddNewPayment={handleAddNewPayment}
            allowMorePayments={allowMorePayments}
          />
        )}

      {!createNewAddress && !editAddress && (
        <StyledGrid
          container
          spacing={1}
          justify="space-between"
          className="checkout-actions">
          <StyledGrid item>
            <StyledButton color="secondary" onClick={() => back()}>
              {t("Payment.Actions.Back")}
            </StyledButton>
          </StyledGrid>
          <StyledGrid item>
            <StyledGrid item>
              {useMultiplePayment && (
                <StyledGrid item>
                  {addNewPayment && allowMorePayments && (
                    <StyledButton
                      color="secondary"
                      disabled={!isValidPayment(currentPaymentNumber)}
                      onClick={handleAddNewPayment}>
                      {t("Payment.Actions.SaveAndAdd")}
                    </StyledButton>
                  )}
                  {!addNewPayment &&
                    selectedPaymentInfoList.length > 0 &&
                    allowMorePayments && (
                      <StyledButton
                        color="secondary"
                        onClick={handleAddNewPayment}>
                        {t("Payment.Actions.AddAnotherPayMethod")}
                      </StyledButton>
                    )}
                </StyledGrid>
              )}
              <StyledGrid item>
                {addNewPayment ? (
                  <StyledButton
                    color="primary"
                    disabled={!isValidPayment(currentPaymentNumber)}
                    onClick={() => {
                      setAddNewPayment(false);
                    }}>
                    {t("Payment.Actions.Finish")}
                  </StyledButton>
                ) : (
                    <StyledButton
                      color="primary"
                      disabled={!canContinue()}
                      onClick={() => submit()}>
                      {t("Payment.Actions.Next")}
                    </StyledButton>
                  )}
              </StyledGrid>
            </StyledGrid>
          </StyledGrid>
        </StyledGrid>
      )}
    </StyledPaper>
  );
};

export default Payment;