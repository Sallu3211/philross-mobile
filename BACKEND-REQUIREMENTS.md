# Backend requirements — account-wide profile & progress

**For:** the PhilRoss API team
**Written:** 10 August 2026
**Status:** ✅ **Sections 3 and 4 are built and deployed** (13 Aug 2026). Section 5 remains.

---

> ## ⚠️ Read this first
>
> Most of this document describes work that is **done**. It is kept because the reasoning and the contracts are still the reference.
>
> | Section | State |
> |---|---|
> | §3 Profile | ✅ Live. Server commit `4bb95c0` |
> | §4 Tutorial progress | ✅ Live. Server commit `81ad9c6` |
> | §5 Course video progress | 🟡 **Still outstanding** — the only one left |
>
> A fourth fault turned up that this document did not anticipate: **social login was overwriting `full_name` on every sign-in**, so even after the profile endpoint existed, a saved name reverted at the next login. Fixed in server commit `f41b96b`. A name is not something a user re-asserts by signing in.
>
> The API is now 33 paths, up from 30. No app release was required for any of it.

---

## 1. How we know what's missing

Not guesswork. Pulled from the live schema:

```bash
curl -s "https://api.philross.com/swagger/?format=openapi"
```

**30 paths total.** The full account surface is:

```
POST   /accounts/signup/
POST   /accounts/login/
POST   /accounts/social-auth-login/
POST   /accounts/verify-otp/
POST   /accounts/token/refresh/
POST   /accounts/forgot-password/request/
POST   /accounts/forgot-password/verify/
POST   /accounts/forgot-password/reset/
DELETE /accounts/delete-account/
```

There is **no endpoint that reads or writes a user profile**, and **none that reads or writes tutorial progress**. `PATCH /accounts/profile/` returns 404 because the route was never created.

---

## 2. What the app already does

Every request below is **already written and wired**. Nothing on the mobile side needs to change when these ship — the calls simply stop returning 404 and start syncing.

| App file | Calls | Today |
|---|---|---|
| `app/helpers/ApiHelper.tsx` → `getProfile` / `updateProfile` | `GET`/`PATCH /accounts/profile/` | 404 → falls back to device |
| `app/helpers/ApiHelper.tsx` → `getFeedProgress` / `setFeedCompleted` | `GET /feed/progress/`, `POST /feed/{slug}/completed/` | 404 → falls back to device |
| `app/helpers/ApiHelper.tsx` → `updateVideoProgress` | `POST /course/{id}/video_watched/` | **Endpoint exists**; app now sends a real body (see §5) |

---

## 3. Profile ✅ DONE — `/accounts/profile/`

**Effect:** a name changed on one phone shows on every device and survives a reinstall.

### Contract

```
GET   /accounts/profile/     → 200 { "id": 12, "full_name": "Phil Ross", "email": "phil@…" }
PATCH /accounts/profile/     ← { "full_name": "Phil R" }     → 200 (same shape)
```

Auth: the same JWT the rest of the API uses. `email` and `id` read-only.

### Implementation

`accounts/serializers.py`

```python
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email']
        read_only_fields = ['id', 'email']
```

`accounts/views.py`

```python
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated


class ProfileView(RetrieveUpdateAPIView):
    """GET returns the signed-in user; PATCH updates their name."""
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
```

`accounts/urls.py`

```python
path('profile/', ProfileView.as_view(), name='profile'),
```

`RetrieveUpdateAPIView` gives GET, PUT and PATCH in one class. Nothing else required.

---

## 4. Tutorial progress ✅ DONE — `/feed/progress/` and `/feed/{slug}/completed/`

**Effect:** completed tutorials come back after a reinstall, and the dashboard ring is the same on every device.

There are **88 tutorials**. The app marks one done when the user taps "Mark as done" or watches past 92%.

### Contract

```
GET  /feed/progress/            → 200 { "data": [
                                     { "slug": "single-rack-squat",
                                       "is_completed": true,
                                       "completed_at": "2026-08-10T09:12:00Z" } ] }

POST /feed/{slug}/completed/    ← { "is_completed": true }   → 200
```

`POST` must be idempotent — the app retries anything queued while offline.
`GET` should return only the signed-in user's rows.

### Implementation

`feed/models.py`

```python
class FeedProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feed_progress')
    feed = models.ForeignKey(Feed, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        # One row per user per tutorial — this is what makes POST idempotent.
        unique_together = ('user', 'feed')
```

`feed/views.py`

```python
class FeedProgressListView(ListAPIView):
    serializer_class = FeedProgressSerializer   # slug, is_completed, completed_at
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FeedProgress.objects.filter(user=self.request.user, is_completed=True)


class FeedCompletedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        feed = get_object_or_404(Feed, slug=slug)
        is_completed = bool(request.data.get('is_completed', True))

        FeedProgress.objects.update_or_create(
            user=request.user,
            feed=feed,
            defaults={
                'is_completed': is_completed,
                'completed_at': timezone.now() if is_completed else None,
            },
        )
        return Response({'status': True})
```

`feed/urls.py`

```python
path('progress/', FeedProgressListView.as_view(), name='feed-progress'),
path('<slug:slug>/completed/', FeedCompletedView.as_view(), name='feed-completed'),
```

> ⚠️ Register `progress/` **before** any `<slug:slug>/` pattern, or Django will match "progress" as a tutorial slug.

---

## 5. Course video progress 🟡 OUTSTANDING — fix the existing endpoint

`POST /course/{id}/video_watched/` **already exists**, but two things stop it working.

**a) The app was sending an empty body.** Every field was commented out, so the server got a bare ping and could never know how far through a video anyone was. **Fixed in the app** — it now sends:

```json
{ "video_id": 42, "course_id": 7, "watch_percentage": 87, "is_completed": false }
```

The view needs to read and store those. Right now `course_completed` comes back as `"0 %"` for every course no matter how much has been watched, which is the visible symptom.

**b) There is no way to read it back.** Add:

```
GET /course/progress/    → 200 { "data": [ { "course_id": 7, "percentage": 42 } ] }
```

Until this exists the app recalculates from its own device storage, so course progress is lost on reinstall exactly like tutorials.

---

## 6. Priority

| # | Endpoint | Effort | Fixes |
|---|---|---|---|
| 1 | `GET`/`PATCH /accounts/profile/` | ✅ done | Name change now saves to the account |
| 2 | `GET /feed/progress/` + `POST /feed/{slug}/completed/` | ✅ done | Tutorial progress survives reinstall |
| 3 | Read the body in `video_watched/`, add `GET /course/progress/` | 🟡 **~1 hour, remaining** | Course progress always reads 0% |

**Only (3) is left.**

---

## 7. How to verify

After deploying, these should all succeed with a valid token:

```bash
TOKEN="<jwt>"

curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.philross.com/accounts/profile/

curl -s -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test Name"}' \
  https://api.philross.com/accounts/profile/

curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.philross.com/feed/progress/
```

And the new paths should appear in `https://api.philross.com/swagger/`.

No app release is needed for any of this. The app picks them up as soon as they respond.
