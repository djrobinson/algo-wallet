/*  Need to take this from order delta instead of the response from ccxt api
    See Order Delta - uO here: https://github.com/Bittrex/bittrex.github.io
The Type key can be one of the following values: 0 = OPEN, 1 = PARTIAL, 2 = FILL, 3 = CANCEL

{
    AccountUuid : Guid,
    Nonce       : int,
    Type        : int,
    Order:
    {
        Uuid              : guid,
        Id                : long,
        OrderUuid         : guid,
        Exchange          : string,
        OrderType         : string,
        Quantity          : decimal,
        QuantityRemaining : decimal,
        Limit             : decimal,
        CommissionPaid    : decimal,
        Price             : decimal,
        PricePerUnit      : decimal,
        Opened            : date,
        Closed            : date,
        IsOpen            : bool,
        CancelInitiated   : bool,
        ImmediateOrCancel : bool,
        IsConditional     : bool,
        Condition         : string,
        ConditionTarget   : decimal,
        Updated           : date
    }
}

*/