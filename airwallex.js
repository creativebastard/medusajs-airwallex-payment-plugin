import logging
import requests
from medusajs import PaymentProcessor

class AirwallexPaymentProcessor(PaymentProcessor):

    def __init__(self, client_id, api_key):
        super().__init__()
        self.client_id = client_id
        self.api_key = api_key

        # Set up logging
        logging.basicConfig(level=logging.INFO)

    def create_payment(self, amount, currency, recipient_details):
        url = "https://api.airwallex.com/v1/payments"
        data = {
            "amount": amount,
            "currency": currency,
            "recipient_details": recipient_details,
        }
        response = requests.post(url, headers={"Authorization": f"Bearer {self.api_key}"}, json=data)

        # Check the status code of the response
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 400:
            logging.error(f"Invalid request: {response.json()}")
            raise ValueError(f"Invalid request: {response.json()}")
        elif response.status_code == 401:
            logging.error(f"Unauthorized: {response.json()}")
            raise Exception(f"Unauthorized: {response.json()}")
        else:
            logging.error(f"Unknown error: {response.status_code}")
            raise Exception(f"Unknown error: {response.status_code}")

    def capture_payment(self, payment_id):
        url = f"https://api.airwallex.com/v1/payments/{payment_id}/capture"
        response = requests.post(url, headers={"Authorization": f"Bearer {self.api_key}"})

        # Check the status code of the response
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 400:
            logging.error(f"Invalid request: {response.json()}")
            raise ValueError(f"Invalid request: {response.json()}")
        elif response.status_code == 401:
            logging.error(f"Unauthorized: {response.json()}")
            raise Exception(f"Unauthorized: {response.json()}")
        else:
            logging.error(f"Unknown error: {response.status_code}")
            raise Exception(f"Unknown error: {response.status_code}")

    def refund_payment(self, payment_id):
        url = f"https://api.airwallex.com/v1/payments/{payment_id}/refund"
        data = {
            "amount": amount,
            "currency": currency,
        }
        response = requests.post(url, headers={"Authorization": f"Bearer {self.api_key}"}, json=data)

        # Check the status code of the response
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 400:
            logging.error(f"Invalid request: {response.json()}")
            raise ValueError(f"Invalid request: {response.json()}")
        elif response.status_code == 401:
            logging.error(f"Unauthorized: {response.json()}")
            raise Exception(f"Unauthorized: {response.json()}")
        else:
            logging.error(f"Unknown error: {response.status_code}")
            raise Exception(f"Unknown error: {response.status_code}")

