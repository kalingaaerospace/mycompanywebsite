import requests

API_KEY = "mwcdx9169f4e3db014cb6a2a5e66f1a43940f"
BASE_URL = "https://www.kalingaaerospace.in/auth.py"

def search_mobile_number(mobile_number):
    # Send a GET request to the API with the number
    response = requests.get(BASE_URL, params={'number': mobile_number, 'apiKey': API_KEY})
    
    # Check if the response is successful
    if response.status_code == 200:
        data = response.json()
        
        # Check if any results match the name "LINGA RAJ DAS"
        for entry in data.get('results', []):
            if "LINGA RAJ DAS" in entry.get('name', ''):
                return entry.get('name'), entry.get('number')
    
    return None

def generate_mobile_combinations_and_search():
    prefix = "737"
    suffix = "66"
    
    found_people = []
    
    # Loop through all possible 5-digit combinations
    for i in range(100000):
        middle = f"{i:05}"
        full_number = prefix + middle + suffix
        
        # Search this number on Truecaller
        result = search_mobile_number(full_number)
        
        if result:
            name, number = result
            print(f"Found: {name} with number {number}")
            found_people.append((name, number))
    
    # Save all found people to a file
    with open("found_people.txt", "w") as file:
        for name, number in found_people:
            file.write(f"{name}: {number}\n")

# Call the function
generate_mobile_combinations_and_search()

