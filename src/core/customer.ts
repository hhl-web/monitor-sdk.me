// todo  用户自定义上报数据

import { ERRORLEVEL, EVENTTYPES ,ERRORTYPES} from "@/common";

interface CustomerType{
    message:string,
    type:ERRORTYPES,
    info:object,
    level:ERRORLEVEL,
}

export const log=(options:CustomerType):void=>{
    //todo
}