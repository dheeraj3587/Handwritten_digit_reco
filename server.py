import json

import torch
from flask import Flask, render_template, request
from PIL import Image, ImageChops, ImageOps
from torchvision import transforms

from main import CNN
from main import SAVE_MODEL_PATH

app = Flask(__name__)
predict = None


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/DigitRecognition", methods=["POST"])
def predict_digit():
    img = Image.open(request.files["img"]).convert("L")

    # predict
    res_json = {"pred": 0, "probs": [0]}
    if predict is not None:
        res = predict(img)
        res_json["pred"] = int(res.argmax())
        res_json["probs"] = [p * 100 for p in res]

    return json.dumps(res_json)


class Predict():
    def __init__(self):
        device = torch.device("cpu")
        self.model = CNN().to(device)
        self.model.load_state_dict(torch.load(SAVE_MODEL_PATH, map_location=device))
        self.transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.5,), (0.5,))])

    def _centering_img(self, img):
        left, top, right, bottom = img.getbbox()
        w, h = img.size[:2]
        shift_x = (left + (right - left) // 2) - w // 2
        shift_y = (top + (bottom - top) // 2) - h // 2
        return ImageChops.offset(img, -shift_x, -shift_y)

    def __call__(self, img):
        img = ImageOps.invert(img)
        img = self._centering_img(img)
        img = img.resize((28, 28), Image.BICUBIC)  # resize to 28x28
        tensor = self.transform(img)
        tensor = tensor.unsqueeze_(0)  # 1,1,28,28

        self.model.eval()
        with torch.no_grad():
            preds = self.model(tensor)
            preds = preds.detach().numpy()[0]

        return preds


if __name__ == "__main__":
    import os
    SAVE_MODEL_PATH = 'trained_model.pth'
    assert os.path.exists(SAVE_MODEL_PATH), "No saved model found at {}".format(SAVE_MODEL_PATH)

    try:
        predict = Predict()
        app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
    except Exception as e:
        print("Error during application startup:", str(e))
        raise e
