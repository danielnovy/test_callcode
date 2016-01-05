import "c1.sol";

contract c2 is c1 {

    function set(string str, uint value, address addr) {
        _str = str;
        _value = value;
        _addr = addr;
    }

}
