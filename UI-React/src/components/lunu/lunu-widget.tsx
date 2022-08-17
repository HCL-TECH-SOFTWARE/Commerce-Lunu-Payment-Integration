import React, { useEffect, useState } from 'react';
import { openPaymentWidgetInCurrentWindow } from 'lunu-payment';
import { Button } from '@material-ui/core';
import lunuService from '../../_foundation/apis/lunu/lunu.service';

const LunuWidget: React.FC<any> = (props: any) => {
    const [showButton, setShowButton] = useState(false);
    const [confirmationToken,setConfirmationToken]=useState<string>("");

    const {amount,email,orderId,idempotenceKey}=props.paymentData;
    const getConfirmationToken = async () => {
        const response = await lunuService.getConfirmationToken({
            amount,email,orderId,idempotenceKey
        });
        setConfirmationToken(response.data.confirmation_token);
        setShowButton(true);
    }
    useEffect(() => {
        getConfirmationToken()
    }, []);

    return (
        <>
          {showButton ? (
            <Button className="lunu-btn" onClick={() => {
                openPaymentWidgetInCurrentWindow({
                    sandbox: true,
                    confirmation_token: confirmationToken,
                    callbacks: {
                        payment_paid: (paymentInfo) => {
                            // Handling a successful payment event
                            // window.location.href = successUrl;
                            console.log("payment paid", paymentInfo);
                            props.onSuccessTransactionOfLunu(paymentInfo);
                        },
                        payment_cancel: () => {
                            // Handling a payment cancellation event
                            // window.location.href = cancelUrl;
                            console.log("payment_cancel");
                        },
                        payment_close: () => {
                            // Handling the event of closing the widget window
                            console.log("payment close");
                        }
                    },
                });
            }}>Pay with Lunu</Button>):null}
        </> 
    );
}

export default LunuWidget;
