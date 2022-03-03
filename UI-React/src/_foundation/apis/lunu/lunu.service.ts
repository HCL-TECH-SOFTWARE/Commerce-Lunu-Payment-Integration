import Axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import { getSite } from "../../hooks/useSite";
import { storageSessionHandler } from "../../utils/storageUtil";

const lunuService = {
    getConfirmationToken(dataObj): AxiosPromise<any> {
        let storeID = getSite()?.storeID;
        let requestOptions: AxiosRequestConfig = Object.assign({
            url: "/wcs/resources/lunu/" + storeID + "/create_payments",
            method: "POST",
            data: dataObj
        });
        return Axios(requestOptions);
    },
};

export default lunuService;