import random
import string

def generate_token(length, jumlah):
    characters = string.digits
    tokens = []
    for _ in range(jumlah):
        token = ''.join(random.choice(characters) for _ in range(length))
        tokens.append(token)
    return tokens

def simpan_token(tokens, filename):
    with open(filename, "w") as f:
        for token in tokens:
            f.write(token + "\n")

def main():
    length = int(input("↑: "))
    jumlah = int(input("›: "))
    tokens = generate_token(length, jumlah)
    print("Token: ")
    for i, token in enumerate(tokens):
        print(f"Token {i+1}: {token}")
    
    simpan = input("save? (y/n): ")
    if simpan.lower() == "y":
        filename = input("nama file: ")
        simpan_token(tokens, filename)
        print("Token telah disimpan ke dalam file", filename)

if __name__ == "__main__":
    main()