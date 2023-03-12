/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/format', 'N/https', 'N/query', 'N/record', 'N/render', 'N/runtime'],
    /**
 * @param{file} file
 * @param{format} format
 * @param{https} https
 * @param{query} query
 * @param{record} record
 * @param{render} render
 * @param{runtime} runtime
 */
    (file, format, https, query, record, render, runtime) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            // log.debug({title: 'onRequest', details: 'Suitelet'});

            if (!scriptContext.request.method === https.Method.GET)
                return ;

            // const paymentData = getPaymentInfo(scriptContext);
            getPaymentInfo(scriptContext);


        }

        const getPaymentInfo = (scriptContext) => {

            const params = scriptContext.request.parameters;
            const recId = params.transactionId;
            const recType = params.recordType;

            const scriptContextAttr = {
                params,
                recId,
                recType
            };

            // log.debug({title: 'Script Context', details: scriptContextAttr});

            if (!recType || !recId)
                return ;

            if (!params.tpl)
                return ;

            const customerPayment = record.load({id: recId, type: recType, isDynamic: true});

            // log.debug({title: 'Record', details: thisRec});

            // Getting Apply Events List Info from Netsuite //
            const applyEventsListName = 'apply';
            const applyEventsLineCount = customerPayment.getLineCount({sublistId: applyEventsListName});

            // Getting Payment Events List Info from Netsuite //
            const paymentEventsListName = 'paymentevent';
            const paymentEventsLineCount = customerPayment.getLineCount({sublistId: paymentEventsListName});

            // log.debug({title: 'Line Counts', details: [applyEventsLineCount, paymentEventsLineCount]});

            // Getting Customer Payment Primary Info //
            const status = customerPayment.getValue({fieldId: 'status'});
            // const arAccount = customerPayment.getValue({fieldId: 'aracct'});
            const arAccount = customerPayment.getText({fieldId: 'aracct'});
            // const customer = customerPayment.getValue({fieldId: 'customer'});
            const customer = customerPayment.getText({fieldId: 'customer'});
            const transactionId = customerPayment.getValue({fieldId: 'tranid'});
            const currency = customerPayment.getText({fieldId: 'currency'});

            // const transactionDate = customerPayment.getValue({fieldId: 'trandate'});
            const transactionDate = format.format({type: format.Type.DATE, value: customerPayment.getValue({fieldId: 'trandate'})});

            const postingPeriod = customerPayment.getText({fieldId: 'postingperiod'});

            const currentDate = new Date();
            const printedDate = format.format({type: format.Type.DATE, value: currentDate});

            const pending = customerPayment.getValue({fieldId: 'pending'});
            const memo = customerPayment.getValue({fieldId: 'memo'});
            // const account = customerPayment.getValue({fieldId: 'account'});
            const account = customerPayment.getText({fieldId: 'account'});
            const subsidiary = customerPayment.getText({fieldId: 'subsidiary'});
            const department = customerPayment.getText({fieldId: 'department'});
            const location = customerPayment.getText({fieldId: 'location'});

            const paymentData = {
                status,
                arAccount,
                customer,
                transactionId,
                currency,
                transactionDate,
                postingPeriod,
                printedDate,
                pending,
                memo,
                account,
                subsidiary,
                department,
                location,
            };

            log.debug({title: 'Payment Data', details: paymentData});

        }

        return {onRequest}

    });
