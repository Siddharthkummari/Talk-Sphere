import face_recognition
import cv2

# Load the reference image
known_image = face_recognition.load_image_file("sid_recent_photo.jpg")
known_face_encoding = face_recognition.face_encodings(known_image)[0]

# Start webcam
video_capture = cv2.VideoCapture(0)

print("Press 'q' to quit")

while True:
    ret, frame = video_capture.read()
    if not ret:
        continue

    # Resize for faster processing
    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)

    # Find face encodings in the current frame
    face_locations = face_recognition.face_locations(small_frame)
    face_encodings = face_recognition.face_encodings(small_frame, face_locations)

    for face_encoding in face_encodings:
        # Compare with known face
        results = face_recognition.compare_faces([known_face_encoding], face_encoding)
        match = results[0]

        label = "Match" if match else "No Match"
        print("Face Match Status:", label)

        # Draw result on frame
        for (top, right, bottom, left) in face_locations:
            # Scale back up since frame was resized
            top *= 4
            right *= 4
            bottom *= 4
            left *= 4

            color = (0, 255, 0) if match else (0, 0, 255)
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            cv2.putText(frame, label, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

    # Show the webcam feed
    cv2.imshow('Webcam Face Match', frame)

    # Exit on pressing 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Cleanup
video_capture.release()
cv2.destroyAllWindows()
