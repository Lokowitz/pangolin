/**
 * Converts a string to an integer, or returns the input unchanged if it is not a string.
 *
 * @param val - The value to convert if it is a string
 * @returns The integer representation of the string, or the original value if not a string
 */
export default function stoi(val: any) {
    if (typeof val === "string") {
        return parseInt(val); 
    }
    else {
        return val;  
    } 
}