function buildFullErrorStack(err: { [k: string]: any }): string {
    let ret: string = String(err.stack)
    while(true) {
        if (err.cause && typeof err.cause === 'function') {
            try {
                err = err.cause()
                if (typeof err !== 'object' || err === null || !err.stack) {
                    break
                }
            } catch(e) {
                break
            }
        } else {
            break
        }
        ret += '\nCaused by: ' + String(err.stack)
    }
    return ret
}

export function serializeIfError(err: any): any {
    if (typeof err !== 'object' || err === null || !err.stack) {
        return err
    }
    const ret: any = {
      stack: buildFullErrorStack(err)
    }
    if (err.message !== undefined) ret.message = err.message
    if (err.name !== undefined) ret.name = err.name
    if (err.code !== undefined) ret.code = err.code
    if (err.signal !== undefined) ret.signal = err.signal
    return ret
}
