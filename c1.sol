contract c1 {
    string public _str;
    uint public _value;
    address public _addr;

    address public _c2Addr;

    function setc2(address c2) {
        _c2Addr = c2;
    }
    
    function enc(string func) internal returns (bytes4) {
        return bytes4(bytes32(sha3(func)));
    }

    function setValues(string str, uint value, address addr) {
        _c2Addr.callcode(
            enc("set(string,uint256,address)"),
            str,
            value,
            addr);
    }

    function setStr(string str) {
        _str = str;
    }
}
