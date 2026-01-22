import requests

def get_fb_token():
    print("--- Facebook Token Generator (Official Method) ---")
    
    # ये डिटेल्स आपको developers.facebook.com से मिलेंगी
    app_id = input("Enter App ID: ")
    app_secret = input("Enter App Secret: ")
    short_lived_token = input("Enter Short-lived Token (from Graph Explorer): ")

    url = "https://graph.facebook.com/v21.0/oauth/access_token"
    
    params = {
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": short_lived_token
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "access_token" in data:
        print("\n✅ सफलता! आपका EAAD6V7 (Long-lived) टोकन यहाँ है:")
        print(data["access_token"])
    else:
        print("\n❌ Error:", data.get("error", {}).get("message"))

if __name__ == "__main__":
    get_fb_token()
