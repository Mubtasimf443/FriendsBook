export function setInpState(setState) {
    return function (event ) {
        setState(event.target.value)
    }
}