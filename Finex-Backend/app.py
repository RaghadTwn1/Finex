from flask import Flask, request, jsonify
from flask_cors import CORS
from ai import analyze

app = Flask(__name__)
CORS(app)  # يسمح للمتصفح يرسل طلبات للسيرفر


@app.route("/")
def home():
    return "Finex Backend Running"


@app.route("/analyze", methods=["POST"])
def analyze_route():
    try:
        data = request.get_json()
        result = analyze(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)